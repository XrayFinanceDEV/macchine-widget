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
        cookieStore.set(SESSION_COOKIE, sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
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

    // Rotating status messages — cycle indefinitely until upstream answer starts.
    // Cycling guarantees continuous byte flow (no idle gap → no proxy 502).
    const statusMessages = [
      "🔍 *L'agente ha cominciato la ricerca...*",
      '📖 *Analizzando la normativa...*',
      '⚙️ *Semplificando le complessità tecniche...*',
      '🧠 *Rianalizzando le fonti pertinenti...*',
      '💭 *Ripensando ancora prima di rispondere...*',
      '📝 *Preparando la risposta...*',
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
        emit(controller, { s: statusMessages[0] })

        // Rotate every 8s, cycling forever until the answer arrives.
        let statusIdx = 1
        const statusTicker = setInterval(() => {
          emit(controller, { s: statusMessages[statusIdx % statusMessages.length] })
          statusIdx++
        }, 8000)

        try {
          const response = await fetch(`${openNotebookEndpoint}/api/chat/rag/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            const errorText = await response.text()
            clearInterval(statusTicker)
            emit(controller, {
              e: `Errore dal server: ${response.status} ${response.statusText} — ${errorText.substring(0, 200)}`,
            })
            controller.close()
            return
          }

          const reader = response.body?.getReader()
          if (!reader) {
            clearInterval(statusTicker)
            controller.close()
            return
          }

          const decoder = new TextDecoder()
          let buffer = ''
          let accumulatedContent = ''

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

              try {
                const parsed = JSON.parse(data)

                if (parsed.type === 'answer') {
                  const content = parsed.content || ''
                  if (!content) continue
                  clearInterval(statusTicker)
                  // Upstream sends accumulated content; only emit new tail.
                  if (content.length > accumulatedContent.length) {
                    const newContent = content.substring(accumulatedContent.length)
                    emit(controller, { c: newContent })
                    accumulatedContent = content
                  }
                } else if (parsed.type === 'complete') {
                  clearInterval(statusTicker)
                  controller.close()
                  return
                } else if (parsed.type === 'error') {
                  clearInterval(statusTicker)
                  emit(controller, { e: parsed.message || 'Upstream error' })
                  controller.close()
                  return
                }
                // strategy events are ignored — rotating statuses cover UX
              } catch {
                // skip malformed SSE lines
              }
            }
          }
          clearInterval(statusTicker)
          controller.close()
        } catch (error) {
          clearInterval(statusTicker)
          const msg = error instanceof Error ? error.message : 'Unknown error'
          emit(controller, { e: `Errore di rete: ${msg}` })
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
