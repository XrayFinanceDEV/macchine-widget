# AI Chat Widget for Open-Notebook

A beautiful, production-ready chat widget for integrating Open-Notebook RAG search into your Next.js applications. Features streaming responses, dark mode support, and a sleek UI built with shadcn/ui.

![AI Chat Widget](https://img.shields.io/badge/Next.js-16.0-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## Features

- ✨ Beautiful, modern UI with shadcn/ui components
- 🚀 Streaming AI responses with Open-Notebook RAG
- 🔌 Direct integration with Open-Notebook search API
- 🌙 Full dark mode support
- 📱 Fully responsive design
- ⚙️ Highly customizable
- 🎨 Non-modal slide-in panel
- ⌨️ Keyboard shortcuts (Enter to send, Escape to close)
- 💬 Quick action buttons
- 🔄 Real-time message streaming

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun
- Open-Notebook instance running (default: https://kpsfinanciallab.w3pro.it:5055)

### Installation

1. Clone the repository:
```bash
cd /home/brix-ia/DEV/ai-widget
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Edit `.env.local` with your configuration:
```env
OPEN_NOTEBOOK_ENDPOINT=https://kpsfinanciallab.w3pro.it:5055
OPEN_NOTEBOOK_NOTEBOOK_ID=notebook:YOUR_NOTEBOOK_ID
OPEN_NOTEBOOK_STRATEGY_MODEL=model:0thy08wqjik4v5y6ftqq
OPEN_NOTEBOOK_CHAT_MODEL=model:0thy08wqjik4v5y6ftqq
```

**Getting your Notebook ID:**
```bash
# List all notebooks
curl https://kpsfinanciallab.w3pro.it:5055/api/notebooks | jq '.[] | {id, name}'

# Copy the ID of the notebook you want to use
```

**Getting Model IDs:**
```bash
# List available models
curl https://kpsfinanciallab.w3pro.it:5055/api/models | jq '.[] | select(.type=="language") | {id, name}'
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the widget in action!

## Usage

### Basic Integration

Add the chat widget to any page:

```tsx
import { AIChatWidget } from '@/components/ai-chat-widget'

export default function Page() {
  return (
    <div>
      {/* Your page content */}

      <AIChatWidget
        title="Knowledge Assistant"
        subtitle="Powered by Open-Notebook"
        welcomeMessage="Hi! Ask me anything about your documents."
        quickActions={[
          "What documents do you have?",
          "Tell me about...",
          "Search for...",
        ]}
      />
    </div>
  )
}
```

### Widget Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string?` | `/api/chat` | API endpoint for chat |
| `welcomeMessage` | `string?` | `"Hi! Ask me anything."` | Initial greeting message |
| `quickActions` | `string[]?` | `["How can you help me?", ...]` | Quick action buttons |
| `title` | `string?` | `"AI Assistant"` | Widget title |
| `subtitle` | `string?` | `undefined` | Optional subtitle/badge |

## Open-Notebook Integration

### How It Works

The widget connects to your Open-Notebook instance via the **hybrid `/api/chat/rag/execute` endpoint**, which combines:

1. **Multi-Search Strategy**: AI generates 3-5 optimized search queries from your question
2. **Parallel Vector Search**: Executes multiple searches simultaneously across your knowledge base
3. **Conversational Memory**: Maintains chat history so the AI remembers previous context
4. **Smart Response**: Generates answers using retrieved documents + conversation history

**Key Benefits:**
- 🧠 **Remembers context**: "Tell me more about that" works naturally
- 🎯 **Dynamic RAG**: Every question triggers fresh, relevant searches
- ⚡ **Faster**: Parallel searches instead of sequential
- 💾 **Persistent sessions**: Conversations survive page reloads (24h cookie)

### API Response Structure

The hybrid endpoint returns Server-Sent Events (SSE) with these event types:

```typescript
// Strategy phase (multi-search executed)
{ "type": "strategy", "chunks_retrieved": 15 }

// Answer streaming (real-time response)
{ "type": "answer", "content": "Based on the research..." }

// Completion signal
{ "type": "complete", "chunks_used": 15 }

// Error handling
{ "type": "error", "message": "..." }
```

The widget streams `answer` content incrementally to the UI for real-time feel.

### Session Management

The widget automatically manages chat sessions:

- **Session Creation**: First message creates a new session
- **Session Storage**: Session ID stored in HTTP-only cookie (24h expiry)
- **Conversation Memory**: All messages in the session are remembered
- **Cross-Page**: Sessions persist across page reloads

**Reset Session (for testing):**
```bash
curl -X POST http://localhost:3000/api/chat/reset
```

Or open your browser DevTools → Application → Cookies → Delete `open_notebook_session`

### Configuring Models

The widget requires two model configurations:
- `OPEN_NOTEBOOK_STRATEGY_MODEL` - For multi-search query generation
- `OPEN_NOTEBOOK_CHAT_MODEL` - For conversation and answer generation

Both are set to `model:0thy08wqjik4v5y6ftqq` (Gemini 2.5 Flash) by default.

## Customization

### Styling

The widget uses Tailwind CSS and shadcn/ui. Customize colors in:
- `app/globals.css` - CSS variables for theme colors
- `components/ai-chat-widget.tsx` - Component-specific styles

### Quick Actions

Customize the quick action buttons:

```tsx
<AIChatWidget
  quickActions={[
    "What's in the knowledge base?",
    "Search for contracts",
    "Find technical documentation",
  ]}
/>
```

### Custom API Endpoint

Use a custom API endpoint:

```tsx
<AIChatWidget
  apiEndpoint="/api/custom-chat"
/>
```

## Project Structure

```
ai-widget/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Open-Notebook API integration
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── ai-chat-widget.tsx        # Main chat widget
├── lib/
│   └── utils.ts                  # Utilities
└── .env.local                    # Open-Notebook configuration
```

## Key Features Explained

### Non-Modal Design

The chat opens as a slide-in panel without blocking page interaction:
- No dark overlay
- Page remains scrollable
- Users can interact with both chat and page content
- Set via `modal={false}` on the Sheet component

### Streaming Responses

Real-time AI responses stream token-by-token from Open-Notebook:
- Strategy reasoning appears first
- Intermediate answers stream as documents are processed
- Final answer provides the synthesized result
- All phases visible in real-time for transparency

### Dark Mode

Automatic dark mode support using Tailwind's dark mode and CSS variables.

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Components

Use shadcn/ui CLI to add components:

```bash
npx shadcn@latest add <component-name>
```

## Troubleshooting

### Widget not appearing
- Check that `<AIChatWidget />` is added to your page
- Verify the component is imported correctly
- Check browser console for errors

### API errors
- Verify Open-Notebook is running at the configured endpoint
- Check that `OPEN_NOTEBOOK_NOTEBOOK_ID` is set correctly
- Verify model IDs match your Open-Notebook configuration:
  ```bash
  curl https://kpsfinanciallab.w3pro.it:5055/api/models | jq '.[] | {id, name}'
  ```
- Review API route logs in terminal (both widget and Open-Notebook)

### "Session not found" errors
- Clear your cookies and start a fresh session
- Check Open-Notebook logs for session creation errors
- Verify notebook_id exists in Open-Notebook

### Streaming not working
- Ensure `maxDuration` is set in the API route
- Check that Open-Notebook streaming is enabled
- Verify network requests in browser DevTools (should see `text/event-stream`)

### No results from search / AI doesn't remember context
- **No search results**: Verify your notebook has indexed documents with embeddings
- **No memory**: Check session cookie is being set (DevTools → Application → Cookies)
- **Partial memory**: Session might have been reset - check cookie expiry (24h default)

### Testing the hybrid endpoint directly
```bash
# Create a session
SESSION=$(curl -s -X POST https://kpsfinanciallab.w3pro.it:5055/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"notebook_id":"YOUR_NOTEBOOK_ID","title":"Test"}' | jq -r '.id')

# Test chat with RAG
curl -N -X POST https://kpsfinanciallab.w3pro.it:5055/api/chat/rag/execute \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION\",
    \"message\": \"What is this notebook about?\",
    \"stream\": true
  }"
```

## 🚀 Deployment

### Quick Decision Guide

**Just want it to work?** → Use Netlify (10 minutes, free)  
**Need full control?** → Self-host (2-4 hours setup)

See [DEPLOYMENT-OPTIONS.md](DEPLOYMENT-OPTIONS.md) for detailed comparison.

### Deploy to Netlify (Recommended)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

Complete guide: [NETLIFY-DEPLOY.md](NETLIFY-DEPLOY.md)

**Benefits:**
- ✅ HTTPS automatic
- ✅ Global CDN
- ✅ Auto-deploy on push
- ✅ FREE tier (100GB/month)

**Steps:**
1. Push to GitHub
2. Connect to Netlify
3. Set environment variables
4. Deploy!

Your URL: `https://your-widget.netlify.app`

---

## 🔌 WordPress Integration

See [WORDPRESS-INTEGRATION.md](WORDPRESS-INTEGRATION.md) for complete guide.

**After deploying to Netlify:**

```html
<!-- Add before </body> tag in WordPress -->
<script>
  window.AIWidgetConfig = {
    baseUrl: 'https://your-widget.netlify.app'
  };
</script>
<script src="https://your-widget.netlify.app/embed.js"></script>
```

This creates a floating chat button 💬 in the bottom-right corner of your site.

**Methods:**
1. **Plugin "Insert Headers and Footers"** (easiest)
2. **Theme editor** (advanced)
3. **Elementor HTML widget** (page-specific)

---

## 🧪 Local Testing

```bash
npm run dev
# Open http://localhost:3000/test-embed.html
```

Test the embed script locally before deploying to production.

## Production Deployment

### 1. Build

```bash
npm run build
```

### 2. Start with PM2

```bash
npm install -g pm2
pm2 start npm --name "ai-widget" -- start
pm2 save
pm2 startup
```

### 3. Configure for your domain

Update `.env.local`:
```env
OPEN_NOTEBOOK_ENDPOINT=https://your-domain.com:5055
OPEN_NOTEBOOK_NOTEBOOK_ID=notebook:your_id
```

### 4. Setup Nginx reverse proxy (optional)

```nginx
server {
    listen 443 ssl;
    server_name kpsfinanciallab.w3pro.it;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## License

MIT

## Credits

Built with:
- [Next.js](https://nextjs.org)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Open-Notebook](https://kpsfinanciallab.w3pro.it:5055)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
