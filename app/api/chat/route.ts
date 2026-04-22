import { cookies } from 'next/headers'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Session cookie name
const SESSION_COOKIE = 'open_notebook_session'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Get open-notebook configuration
    const openNotebookEndpoint = process.env.OPEN_NOTEBOOK_ENDPOINT
    const notebookId = process.env.OPEN_NOTEBOOK_NOTEBOOK_ID
    const strategyModel = process.env.OPEN_NOTEBOOK_STRATEGY_MODEL
    const chatModel = process.env.OPEN_NOTEBOOK_CHAT_MODEL

    if (!openNotebookEndpoint) {
      throw new Error('OPEN_NOTEBOOK_ENDPOINT not configured')
    }
    if (!notebookId) {
      throw new Error('OPEN_NOTEBOOK_NOTEBOOK_ID not configured')
    }
    if (!strategyModel || !chatModel) {
      throw new Error('Model configuration incomplete')
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    const currentQuestion = lastMessage.content || lastMessage.parts?.find((p: any) => p.type === 'text')?.text || ''

    if (!currentQuestion) {
      throw new Error('No question provided')
    }

    // Get or create chat session
    const cookieStore = await cookies()
    let sessionId = cookieStore.get(SESSION_COOKIE)?.value

    if (!sessionId) {
      console.log('No session found, creating new session...')
      
      // Create new session
      const createSessionResponse = await fetch(`${openNotebookEndpoint}/api/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notebook_id: notebookId,
          title: 'Widget Chat',
          model_override: chatModel
        })
      })

      if (!createSessionResponse.ok) {
        const errorText = await createSessionResponse.text()
        throw new Error(`Failed to create session: ${createSessionResponse.statusText} - ${errorText}`)
      }

      const sessionData = await createSessionResponse.json()
      sessionId = sessionData.id

      console.log('Created new session:', sessionId)

      // Store session in cookie (expires in 24 hours)
      if (sessionId) {
        cookieStore.set(SESSION_COOKIE, sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 // 24 hours
        })
      }
    } else {
      console.log('Using existing session:', sessionId)
    }

    // Call hybrid chat+RAG endpoint
    const payload = {
      session_id: sessionId,
      message: currentQuestion,
      strategy_model: strategyModel,
      model_override: chatModel,
      stream: true
    }

    console.log('Calling chat/rag/execute with:', {
      session_id: sessionId,
      message: currentQuestion.substring(0, 50) + '...',
      strategy_model: strategyModel
    })

    const response = await fetch(`${openNotebookEndpoint}/api/chat/rag/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Open-notebook API error: ${response.statusText} - ${errorText}`)
    }

    // Stream the response directly to the client
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          controller.close()
          return
        }

        try {
          let buffer = ''
          let accumulatedContent = ''

          while (true) {
            const { done, value } = await reader.read()

            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                
                try {
                  const parsed = JSON.parse(data)
                  console.log('Parsed event:', parsed.type)
                  
                  // Handle different event types
                  if (parsed.type === 'strategy') {
                    console.log('Strategy phase: chunks_retrieved =', parsed.chunks_retrieved)
                    // Optional: send loading indicator
                    // controller.enqueue(encoder.encode('[Searching knowledge base...]\n'))
                  }
                  else if (parsed.type === 'answer') {
                    // Stream answer content
                    const content = parsed.content || ''
                    if (content) {
                      console.log('Streaming answer content:', content.substring(0, 100))
                      
                      // Send only new content (not already sent)
                      if (content.length > accumulatedContent.length) {
                        const newContent = content.substring(accumulatedContent.length)
                        controller.enqueue(encoder.encode(newContent))
                        accumulatedContent = content
                      }
                    }
                  }
                  else if (parsed.type === 'complete') {
                    console.log('Stream complete, chunks_used:', parsed.chunks_used)
                    controller.close()
                    return
                  }
                  else if (parsed.type === 'error') {
                    console.error('Stream error:', parsed.message)
                    controller.error(new Error(parsed.message))
                    return
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', data, e)
                }
              }
            }
          }
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
