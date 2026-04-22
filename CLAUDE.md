# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI Chat Widget built with Next.js 16, designed for integrating Langflow AI agents (or OpenAI) into web applications. The widget features streaming responses, non-modal UI design, and full customization support.

**Tech Stack:**
- Next.js 16 (App Router, TypeScript)
- Vercel AI SDK v5 (`ai` + `@ai-sdk/react` + `@ai-sdk/openai`)
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS v4

## Development Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Production build (requires TypeScript compilation)
npm run start    # Start production server
npm run lint     # Run ESLint
```

**Adding shadcn/ui components:**
```bash
npx shadcn@latest add <component-name>
```

## Architecture & Key Patterns

### Vercel AI SDK v5 Integration

**IMPORTANT:** This project uses AI SDK v5 which has significant API differences from v4:

1. **Chat Hook Usage** (`@ai-sdk/react`):
   ```tsx
   import { useChat } from '@ai-sdk/react'
   import { DefaultChatTransport } from 'ai'

   const { messages, sendMessage, status } = useChat({
     transport: new DefaultChatTransport({
       api: '/api/chat',
       body: { flowId }
     })
   })
   ```
   - NO `input`, `handleInputChange`, `handleSubmit` helpers (v4 pattern)
   - Use `sendMessage({ text: string })` instead
   - Status values: `'submitted' | 'streaming' | 'ready' | 'error'` (not `'generating'`)

2. **Message Structure** (`UIMessage`):
   ```tsx
   interface UIMessage {
     id: string
     role: 'system' | 'user' | 'assistant'
     parts: Array<UIMessagePart>  // NOT message.content
   }
   ```
   - Messages have `parts` array, not direct `content` property
   - Text is in `parts.find(p => p.type === 'text')?.text`
   - Currently widget expects `message.content` (needs fixing if rendering breaks)

3. **Server-Side Streaming** (`ai` package):
   ```tsx
   import { streamText } from 'ai'

   const result = streamText({
     model: openai('gpt-4o-mini'),
     messages,
     system: '...'
   })

   return result.toTextStreamResponse()  // NOT toDataStreamResponse()
   ```

### Chat Widget Component (`components/ai-chat-widget.tsx`)

**Non-Modal Sheet Pattern:**
- Uses `<Sheet modal={false}>` to keep page interactive while chat is open
- No overlay, users can scroll and interact with page content
- Fixed position button (bottom-right), slide-in panel (right side)

**Component Props:**
```tsx
interface AIChatWidgetProps {
  flowId?: string           // Langflow flow ID
  apiEndpoint?: string      // Default: '/api/chat'
  welcomeMessage?: string
  quickActions?: string[]   // Suggestion chips shown before first message
  title?: string
  subtitle?: string         // Badge displayed in header
}
```

### API Route Architecture (`app/api/chat/route.ts`)

**Dual Backend Support:**
- **Option 1 (Default):** OpenAI direct via `@ai-sdk/openai`
- **Option 2:** Langflow proxy (commented out code)

**Switching Backends:**
1. Comment out OpenAI section (lines 13-19)
2. Uncomment Langflow section (lines 25-69)
3. Update `.env.local` with Langflow credentials

**Environment Variables:**
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Langflow (if using Option 2)
LANGFLOW_ENDPOINT=http://localhost:7860
LANGFLOW_API_KEY=...
LANGFLOW_FLOW_ID=...
```

**Key Details:**
- `export const maxDuration = 30` - Required for Edge Runtime streaming
- Request body includes `{ messages, flowId }`
- Langflow integration sends only last user message, not full history
- Response parsing path: `langflowData.outputs?.[0]?.outputs?.[0]?.results?.message?.text`

### Project Structure

```
app/
├── api/chat/route.ts       # Chat API endpoint (OpenAI/Langflow)
├── layout.tsx              # Root layout with fonts
├── page.tsx                # Landing page demo
└── globals.css             # Tailwind + CSS variables

components/
├── ui/                     # shadcn/ui components (auto-generated)
└── ai-chat-widget.tsx      # Main chat widget

lib/
└── utils.ts                # cn() utility for class merging
```

### Path Aliases

Import alias `@/*` maps to project root:
```tsx
import { AIChatWidget } from '@/components/ai-chat-widget'
import { cn } from '@/lib/utils'
```

### shadcn/ui Configuration

- **Style:** "new-york" variant
- **Base color:** neutral
- **CSS variables mode:** enabled
- **Icon library:** lucide-react
- Components are installed to `components/ui/`
- Config file: `components.json`

## Common Modifications

### Adding a New AI Provider

1. Install provider SDK: `npm install @ai-sdk/anthropic` (example)
2. Edit `app/api/chat/route.ts`:
   ```tsx
   import { anthropic } from '@ai-sdk/anthropic'

   const result = streamText({
     model: anthropic('claude-3-5-sonnet-20241022'),
     messages,
     system: '...'
   })
   ```
3. Update `.env.local` with new provider's API key

### Customizing Widget Styles

- **Colors:** Edit CSS variables in `app/globals.css`
- **Layout:** Modify classes in `components/ai-chat-widget.tsx`
- **shadcn theme:** Change `baseColor` in `components.json` and regenerate components

### Rendering Message Content

**Current Issue:** Widget uses `message.content` but v5 uses `message.parts[]`

**To Fix:** Update message rendering in `ai-chat-widget.tsx:114`:
```tsx
{messages.map((message) => {
  const textPart = message.parts.find(p => p.type === 'text')
  const content = textPart?.text || ''

  return (
    <div key={message.id} ...>
      <p className="text-sm whitespace-pre-wrap">{content}</p>
    </div>
  )
})}
```

## Documentation Files

- `README.md` - Full project documentation
- `LANGFLOW_INTEGRATION.md` - Langflow setup guide (detailed)
- `QUICK_START.md` - Quick reference for getting started
- `.env.local.example` - Environment variables template

## Important Notes

1. **TypeScript Build Errors:** The project has a known issue with `message.content` (should be `message.parts[].text`). This will fail `npm run build` until fixed.

2. **Streaming Configuration:** The API route uses Edge Runtime (`maxDuration = 30`). Streaming requires this configuration.

3. **Client-Side State:** Widget manages its own input state separately from `useChat` hook due to v5 API changes.

4. **Non-Modal Design:** The `modal={false}` prop on Sheet is critical - removing it will add an overlay and break the user experience.

5. **Message Transport:** Uses `DefaultChatTransport` for HTTP communication. Custom transports can be created for WebSocket or other protocols.
