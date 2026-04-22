import { cookies } from 'next/headers'

const SESSION_COOKIE = 'open_notebook_session'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Session reset' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Reset error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to reset session' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
