import { cookies } from 'next/headers'

// Run on Edge runtime — Netlify Edge Functions allow ~50s and stream first-byte
// without buffering (Node serverless functions cap at 26s and buffer, causing 502s).
export const runtime = 'edge'
export const maxDuration = 50

const SESSION_COOKIE = 'open_notebook_session'

// JSON-lines protocol between this route and the widget client:
//   {"s": "<text>"}   → status update (replaces the current status slot)
//   {"c": "<text>"}   → content chunk (appends to the answer)
//   {"e": "<text>"}   → error (client shows it inline)
// Each object is on its own line terminated with \n.
//
// Upstream Open Notebook SSE events we consume (from /api/chat/rag/execute):
//   planning / searching  → keep-alive pings during agent phases → {s} cycled
//   plan { reasoning }    → short planning-agent output → {s} showing reasoning
//   strategy { chunks_retrieved } → search complete → {s} "found N sources"
//   answer_delta { content } → responding-agent token → {c} appended
//   answer { content }    → final consolidated answer (ignored, already streamed)
//   complete              → close stream
//   error { message }     → propagate as {e}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const openNotebookEndpoint = process.env.OPEN_NOTEBOOK_ENDPOINT
    const notebookId = process.env.OPEN_NOTEBOOK_NOTEBOOK_ID
    const strategyModel = process.env.OPEN_NOTEBOOK_STRATEGY_MODEL
    const chatModel = process.env.OPEN_NOTEBOOK_CHAT_MODEL

    if (!openNotebookEndpoint) throw new Error('OPEN_NOTEBOOK_ENDPOINT not configured')
    if (!notebookId) throw new Error('OPEN_NOTEBOOK_NOTEBOOK_ID not configured')
    if (!strategyModel || !chatModel) throw new Error('Model configuration incomplete')

    const lastMessage = messages[messages.length - 1]
    const currentQuestion =
      lastMessage.content ||
      lastMessage.parts?.find((p: { type: string; text?: string }) => p.type === 'text')?.text ||
      ''
    if (!currentQuestion) throw new Error('No question provided')

    // Session lookup happens BEFORE streaming starts so we can set the cookie
    // on the outgoing Response. Upstream RAG call happens inside the stream.
    const cookieStore = await cookies()
    let sessionId = cookieStore.get(SESSION_COOKIE)?.value

    if (!sessionId) {
      const createSessionResponse = await fetch(`${openNotebookEndpoint}/api/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_id: notebookId,
          title: 'Widget Chat',
          model_override: chatModel,
        }),
      })
      if (!createSessionResponse.ok) {
        const errorText = await createSessionResponse.text()
        throw new Error(
          `Failed to create session: ${createSessionResponse.statusText} - ${errorText}`
        )
      }
      const sessionData = await createSessionResponse.json()
      sessionId = sessionData.id
      if (sessionId) {
        // SameSite=None + Secure is required because the widget is loaded as an
        // iframe on third-party sites (WordPress embeds). With Lax, browsers
        // refuse to store/send the cookie from a cross-site iframe, which
        // silently forces a fresh chat_session on every message and breaks
        // multi-turn context (no prior messages → no condensation).
        cookieStore.set(SESSION_COOKIE, sessionId, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 60 * 60 * 24,
        })
      }
    }

    const payload = {
      session_id: sessionId,
      message: currentQuestion,
      notebook_id: notebookId,
      strategy_model: strategyModel,
      model_override: chatModel,
      stream: true,
    }

    const encoder = new TextEncoder()

    // Fallback status messages shown while upstream is in its keep-alive phases.
    // Upstream sends `planning` / `searching` pings every ~3s; we cycle through
    // these so the user sees life rather than one frozen line.
    const planningMessages = [
      "🔍 *L'agente sta pianificando la ricerca...*",
      '🧠 *Analizzando la tua domanda...*',
      '📋 *Scegliendo cosa cercare...*',
    ]
    const searchingMessages = [
      '📖 *Cercando nella normativa...*',
      '🗂️ *Scorrendo le fonti pertinenti...*',
      '🔎 *Raccogliendo i passaggi rilevanti...*',
    ]

    const emit = (controller: ReadableStreamDefaultController<Uint8Array>, obj: object) => {
      try {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))
      } catch {
        // controller closed
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        // Flush first status immediately — fixes Netlify first-byte 502s.
        emit(controller, { s: planningMessages[0] })

        // Hard timeout: leaves headroom under Netlify Edge's 50s cap so we can
        // emit a clean error instead of being killed mid-stream.
        const abort = new AbortController()
        const upstreamTimeout = setTimeout(() => abort.abort(), 45000)

        let planningTick = 0
        let searchingTick = 0

        try {
          const response = await fetch(`${openNotebookEndpoint}/api/chat/rag/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: abort.signal,
          })

          if (!response.ok) {
            const errorText = await response.text()
            clearTimeout(upstreamTimeout)
            emit(controller, {
              e: `Errore dal server: ${response.status} ${response.statusText} — ${errorText.substring(0, 200)}`,
            })
            controller.close()
            return
          }

          const reader = response.body?.getReader()
          if (!reader) {
            clearTimeout(upstreamTimeout)
            controller.close()
            return
          }

          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (!data) continue

              let parsed: { type?: string; content?: string; reasoning?: string; message?: string; chunks_retrieved?: number }
              try {
                parsed = JSON.parse(data)
              } catch {
                continue
              }

              switch (parsed.type) {
                case 'planning': {
                  const msg = planningMessages[planningTick % planningMessages.length]
                  planningTick++
                  emit(controller, { s: msg })
                  break
                }
                case 'plan': {
                  const reasoning = (parsed.reasoning || '').trim()
                  if (reasoning) emit(controller, { s: `💡 *${reasoning}*` })
                  break
                }
                case 'searching': {
                  const msg = searchingMessages[searchingTick % searchingMessages.length]
                  searchingTick++
                  emit(controller, { s: msg })
                  break
                }
                case 'strategy': {
                  const n = parsed.chunks_retrieved ?? 0
                  emit(controller, { s: `📚 *Trovate ${n} fonti pertinenti, sto preparando la risposta...*` })
                  break
                }
                case 'answer_delta': {
                  if (parsed.content) emit(controller, { c: parsed.content })
                  break
                }
                case 'answer':
                  // Final consolidated answer — already delivered via deltas. Skip.
                  break
                case 'complete':
                  clearTimeout(upstreamTimeout)
                  controller.close()
                  return
                case 'error':
                  clearTimeout(upstreamTimeout)
                  emit(controller, { e: parsed.message || 'Upstream error' })
                  controller.close()
                  return
              }
            }
          }
          clearTimeout(upstreamTimeout)
          controller.close()
        } catch (error) {
          clearTimeout(upstreamTimeout)
          const isAbort =
            (error instanceof Error && error.name === 'AbortError') ||
            abort.signal.aborted
          const msg = isAbort
            ? 'La richiesta sta impiegando troppo tempo. Il backend è lento — riprova con una domanda più specifica o attendi qualche secondo.'
            : `Errore di rete: ${error instanceof Error ? error.message : 'Unknown error'}`
          emit(controller, { e: msg })
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
