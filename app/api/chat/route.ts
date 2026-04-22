import { cookies } from 'next/headers'

// Run on Edge runtime — Netlify Edge Functions allow ~50s and stream first-byte
// without buffering (Node serverless functions cap at 26s and buffer, causing 502s).
export const runtime = 'edge'
export const maxDuration = 50

const SESSION_COOKIE = 'open_notebook_session'

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
    // on the outgoing Response. Upstream RAG call happens inside the stream
    // so the first byte (status message) flushes instantly.
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

    const stream = new ReadableStream({
      async start(controller) {
        // Flush the first byte immediately — fixes Netlify proxy 502s and
        // gives the user feedback while the agent is searching.
        controller.enqueue(
          encoder.encode("🔍 *L'agente sta cercando nella normativa...*\n\n---\n\n")
        )

        // Keep-alive ticker: emits a zero-width space every 8s while we wait
        // for upstream. Invisible in rendered markdown, keeps proxies happy.
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode('​'))
          } catch {
            // controller already closed
          }
        }, 8000)

        try {
          const response = await fetch(`${openNotebookEndpoint}/api/chat/rag/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            const errorText = await response.text()
            clearInterval(keepAlive)
            controller.enqueue(
              encoder.encode(
                `\n\n⚠️ Errore dal server: ${response.status} ${response.statusText}\n${errorText.substring(0, 200)}`
              )
            )
            controller.close()
            return
          }

          const reader = response.body?.getReader()
          if (!reader) {
            clearInterval(keepAlive)
            controller.close()
            return
          }

          const decoder = new TextDecoder()
          let buffer = ''
          let accumulatedContent = ''
          let answerStarted = false

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
                  // Stop the keep-alive the moment real content starts
                  if (!answerStarted) {
                    clearInterval(keepAlive)
                    answerStarted = true
                  }
                  // Only emit new tail (upstream sends accumulated content)
                  if (content.length > accumulatedContent.length) {
                    const newContent = content.substring(accumulatedContent.length)
                    controller.enqueue(encoder.encode(newContent))
                    accumulatedContent = content
                  }
                } else if (parsed.type === 'complete') {
                  clearInterval(keepAlive)
                  controller.close()
                  return
                } else if (parsed.type === 'error') {
                  clearInterval(keepAlive)
                  controller.enqueue(encoder.encode(`\n\n⚠️ Errore: ${parsed.message}`))
                  controller.close()
                  return
                }
                // 'strategy' events are ignored — the initial status line covers UX
              } catch {
                // skip malformed SSE lines
              }
            }
          }
          clearInterval(keepAlive)
          controller.close()
        } catch (error) {
          clearInterval(keepAlive)
          const msg = error instanceof Error ? error.message : 'Unknown error'
          controller.enqueue(encoder.encode(`\n\n⚠️ Errore di rete: ${msg}`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        // Hint to proxies (nginx, etc) to not buffer the response
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
