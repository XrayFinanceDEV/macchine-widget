# Langflow Integration Guide

This guide explains how to integrate your AI Chat Widget with Langflow agents.

## Overview

Langflow is a visual framework for building AI applications. This widget can connect to any Langflow flow that accepts chat input and returns text responses.

## Prerequisites

1. A running Langflow instance (local or hosted)
2. A Langflow flow configured for chat interactions
3. Your flow ID and API key (if authentication is enabled)

## Setup Steps

### 1. Get Your Langflow Credentials

From your Langflow dashboard:
- Copy your **Flow ID** (found in the flow URL or settings)
- Generate an **API Key** if authentication is enabled
- Note your **Langflow endpoint** (e.g., `http://localhost:7860` for local)

### 2. Configure Environment Variables

Create or update `.env.local`:

```env
# Langflow Configuration
LANGFLOW_ENDPOINT=http://localhost:7860
LANGFLOW_API_KEY=your_api_key_here
LANGFLOW_FLOW_ID=your_flow_id_here

# Optional: Make flow ID available to client
NEXT_PUBLIC_LANGFLOW_FLOW_ID=your_flow_id_here
```

### 3. Update the API Route

Edit `app/api/chat/route.ts`:

**Comment out the OpenAI section:**
```typescript
// const result = streamText({
//   model: openai('gpt-4o-mini'),
//   messages,
//   system: 'You are a helpful AI assistant...',
// })
//
// return result.toDataStreamResponse()
```

**Uncomment the Langflow section:**
```typescript
const langflowEndpoint = process.env.LANGFLOW_ENDPOINT
const langflowApiKey = process.env.LANGFLOW_API_KEY

if (!langflowEndpoint) {
  throw new Error('LANGFLOW_ENDPOINT not configured')
}

// Get the last user message
const lastMessage = messages[messages.length - 1]

// Call Langflow API
const langflowResponse = await fetch(`${langflowEndpoint}/api/v1/run/${flowId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(langflowApiKey && { 'Authorization': `Bearer ${langflowApiKey}` })
  },
  body: JSON.stringify({
    input_value: lastMessage.content,
    output_type: 'chat',
    input_type: 'chat',
    tweaks: {}
  })
})

if (!langflowResponse.ok) {
  throw new Error(`Langflow API error: ${langflowResponse.statusText}`)
}

const langflowData = await langflowResponse.json()

// Extract the response from Langflow
const aiResponse = langflowData.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
                  langflowData.result ||
                  'No response from Langflow'

// Return as a streaming response
const result = streamText({
  model: openai('gpt-4o-mini'),
  messages: [{ role: 'assistant', content: aiResponse }],
})

return result.toDataStreamResponse()
```

### 4. Update the Widget Component

Pass the flow ID to the widget in `app/page.tsx`:

```tsx
<AIChatWidget
  flowId={process.env.NEXT_PUBLIC_LANGFLOW_FLOW_ID}
  title="AI Assistant"
  subtitle="Powered by Langflow"
/>
```

## Langflow API Details

### API Endpoint Structure

The widget calls Langflow using this endpoint pattern:
```
POST {LANGFLOW_ENDPOINT}/api/v1/run/{FLOW_ID}
```

### Request Format

```json
{
  "input_value": "User message here",
  "output_type": "chat",
  "input_type": "chat",
  "tweaks": {}
}
```

### Expected Response Format

Langflow should return a response with this structure:

```json
{
  "outputs": [
    {
      "outputs": [
        {
          "results": {
            "message": {
              "text": "AI response here"
            }
          }
        }
      ]
    }
  ]
}
```

**Or simplified format:**
```json
{
  "result": "AI response here"
}
```

### Custom Response Parsing

If your flow returns a different structure, update the parsing logic in `app/api/chat/route.ts`:

```typescript
// Example: Custom parsing for different structure
const aiResponse =
  // Try standard format first
  langflowData.outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
  // Try simplified format
  langflowData.result ||
  // Try custom format (adjust to your flow)
  langflowData.data?.response ||
  langflowData.answer ||
  'No response from Langflow'
```

## Advanced Configuration

### Using Flow Tweaks

Langflow allows runtime configuration via "tweaks". Add them to the API request:

```typescript
body: JSON.stringify({
  input_value: lastMessage.content,
  output_type: 'chat',
  input_type: 'chat',
  tweaks: {
    // Example tweaks - adjust based on your flow
    "ChatOpenAI-xxxxx": {
      "temperature": 0.7,
      "max_tokens": 500
    },
    "PromptTemplate-xxxxx": {
      "template": "Custom prompt: {input}"
    }
  }
})
```

### Multiple Flows

Support different flows for different contexts:

**In your page:**
```tsx
<AIChatWidget
  flowId="flow-id-for-support"
  title="Support Assistant"
/>

<AIChatWidget
  flowId="flow-id-for-sales"
  title="Sales Assistant"
/>
```

### Conversation History

To maintain conversation context, modify the API route to send full message history:

```typescript
// Instead of just the last message
const conversationHistory = messages.map(m => ({
  role: m.role,
  content: m.content
}))

body: JSON.stringify({
  input_value: lastMessage.content,
  conversation_history: conversationHistory,
  output_type: 'chat',
  input_type: 'chat',
  tweaks: {}
})
```

Make sure your Langflow flow is configured to handle conversation history.

## Testing

### 1. Test Langflow Flow Directly

Before integrating, test your flow in Langflow:
1. Open your flow in Langflow
2. Use the built-in chat interface
3. Verify responses are working correctly

### 2. Test API Endpoint

Use curl to test the API:

```bash
curl -X POST http://localhost:7860/api/v1/run/YOUR_FLOW_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "input_value": "Hello, how are you?",
    "output_type": "chat",
    "input_type": "chat"
  }'
```

### 3. Test Widget Integration

1. Start your Next.js dev server: `npm run dev`
2. Open the chat widget
3. Send a test message
4. Check browser console for errors
5. Check terminal logs for API responses

## Troubleshooting

### Error: "LANGFLOW_ENDPOINT not configured"
- Verify `.env.local` exists and has the correct variables
- Restart the dev server after adding environment variables

### Error: "Langflow API error: 404"
- Check that your flow ID is correct
- Verify the Langflow endpoint URL is accessible
- Ensure the flow is deployed/published in Langflow

### Error: "Langflow API error: 401"
- Check that your API key is correct
- Verify authentication is properly configured in Langflow
- Try without API key if authentication is disabled

### Response is "No response from Langflow"
- Check the API response structure in browser DevTools
- Update the response parsing logic to match your flow's output
- Verify your flow has a proper output component

### Slow Responses
- Check Langflow server performance
- Consider adding response timeouts
- Optimize your Langflow flow (reduce unnecessary steps)

## Production Considerations

### Security

1. **Never expose API keys to the client:**
   ```typescript
   // ❌ DON'T DO THIS
   NEXT_PUBLIC_LANGFLOW_API_KEY=secret

   // ✅ DO THIS (no NEXT_PUBLIC_ prefix)
   LANGFLOW_API_KEY=secret
   ```

2. **Add rate limiting:**
   - Implement rate limiting in the API route
   - Use libraries like `rate-limiter-flexible`

3. **Validate inputs:**
   - Sanitize user messages before sending to Langflow
   - Implement content filtering if needed

### Performance

1. **Add caching:**
   - Cache common questions/responses
   - Use Redis or in-memory cache

2. **Add timeouts:**
   ```typescript
   const controller = new AbortController()
   const timeout = setTimeout(() => controller.abort(), 30000)

   const langflowResponse = await fetch(url, {
     ...options,
     signal: controller.signal
   })

   clearTimeout(timeout)
   ```

3. **Monitor performance:**
   - Log response times
   - Track error rates
   - Monitor Langflow server health

### Deployment

When deploying to production:

1. **Update environment variables** on your hosting platform (Vercel, Netlify, etc.)
2. **Use production Langflow URL** (not localhost)
3. **Enable HTTPS** for Langflow endpoint
4. **Set up proper CORS** if Langflow is on a different domain
5. **Add error monitoring** (Sentry, LogRocket, etc.)

## Example Flows

### Basic Chat Flow

A simple flow structure for the widget:
1. **Chat Input** component - receives user message
2. **OpenAI** component - processes with GPT
3. **Chat Output** component - returns response

### RAG Flow

For knowledge-base queries:
1. **Chat Input** - user question
2. **Vector Store** - retrieve relevant documents
3. **Combine Documents** - merge retrieved context
4. **OpenAI** - answer based on context
5. **Chat Output** - return answer

### Agent Flow

For complex interactions:
1. **Chat Input** - user request
2. **Agent** - orchestrate multiple tools
3. **Tools** (API calls, calculations, etc.)
4. **Chat Output** - return agent response

## Resources

- [Langflow Documentation](https://docs.langflow.org/)
- [Langflow API Reference](https://docs.langflow.org/api-reference)
- [Vercel AI SDK Docs](https://ai-sdk.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## Support

For issues with:
- **Widget integration**: Check this repo's issues
- **Langflow flows**: Check [Langflow Discord](https://discord.gg/langflow)
- **API errors**: Enable verbose logging in `app/api/chat/route.ts`
