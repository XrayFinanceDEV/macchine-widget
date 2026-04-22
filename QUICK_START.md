# Quick Start Guide

Your AI Chat Widget project is set up and ready to go! Here's how to get started.

## What's Been Set Up

✅ Next.js 16 with TypeScript
✅ Vercel AI SDK v5 with React hooks
✅ shadcn/ui components (Sheet, ScrollArea, Textarea, Button, Badge)
✅ AI Chat Widget component adapted for Langflow
✅ API route for both OpenAI and Langflow integration
✅ Beautiful landing page showcasing the widget
✅ Full documentation (README.md, LANGFLOW_INTEGRATION.md)

## Start Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) to see your app!

## Next Steps

### 1. Add Your API Key

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Then add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-key-here
```

### 2. Test the Chat Widget

1. Open http://localhost:3000
2. Click the chat button in the bottom-right corner
3. Try asking a question!

The widget is currently configured to use OpenAI's GPT-4o-mini model.

### 3. (Optional) Integrate with Langflow

If you want to connect to a Langflow agent instead:

1. Read `LANGFLOW_INTEGRATION.md` for detailed instructions
2. Edit `app/api/chat/route.ts`:
   - Comment out the OpenAI section (lines 13-19)
   - Uncomment the Langflow section (lines 25-69)
3. Add Langflow credentials to `.env.local`:
   ```env
   LANGFLOW_ENDPOINT=http://localhost:7860
   LANGFLOW_API_KEY=your_key
   LANGFLOW_FLOW_ID=your_flow_id
   ```

## Project Structure

```
ai-widget/
├── app/
│   ├── api/chat/route.ts     # Chat API route (OpenAI + Langflow options)
│   ├── page.tsx              # Landing page with widget
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── ai-chat-widget.tsx    # Main chat widget component
├── .env.local                # Your API keys (create this!)
└── README.md                 # Full documentation
```

## Customizing the Widget

Edit `app/page.tsx` to customize the widget:

```tsx
<AIChatWidget
  title="Your Assistant Name"
  subtitle="Powered by Your Service"
  welcomeMessage="Custom greeting message"
  quickActions={[
    "Your first quick action",
    "Your second quick action",
    "Your third quick action",
  ]}
  flowId="your-langflow-flow-id"
/>
```

## Build for Production

```bash
npm run build
npm run start
```

## Common Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter
```

## Need Help?

- **Widget not working?** Check the [Troubleshooting](README.md#troubleshooting) section in README.md
- **Integrating Langflow?** See [LANGFLOW_INTEGRATION.md](LANGFLOW_INTEGRATION.md)
- **Customizing styles?** Edit `app/globals.css` and `components/ai-chat-widget.tsx`

## What's Next?

- Add your own styling and branding
- Customize the landing page
- Integrate with your Langflow agents
- Deploy to Vercel or your hosting platform
- Add authentication if needed

Happy coding! 🚀
