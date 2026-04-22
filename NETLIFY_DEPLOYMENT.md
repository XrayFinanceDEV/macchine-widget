# Netlify Deployment Guide

## Pre-Deployment Checklist

### ✅ Dependencies Status
All dependencies are compatible with Netlify deployment:
- **Next.js 16.0.10** - Fully supported
- **React 19.2.1** - Latest version
- **AI SDK v5** - Compatible with Edge Runtime
- **Tailwind CSS v4** - No issues
- **Node.js 20** - Configured in netlify.toml

### 📋 Required Environment Variables

You **MUST** configure these in Netlify before deployment:

#### Server-Side Variables (Build & Runtime)
```
LANGFLOW_ENDPOINT=https://your-langflow-instance.com
LANGFLOW_API_KEY=your-langflow-api-key
```

#### Client-Side Variables (Must be prefixed with NEXT_PUBLIC_)
```
NEXT_PUBLIC_LANGFLOW_FLOW_ID=your-flow-id-here
```

## Deployment Steps

### 1. Push to Git Repository
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### 2. Deploy on Netlify

#### Option A: Netlify UI (Recommended for first deployment)
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Netlify will auto-detect Next.js settings from `netlify.toml`
6. Add environment variables (see section below)
7. Click "Deploy site"

#### Option B: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

### 3. Configure Environment Variables in Netlify

**Via Netlify UI:**
1. Go to Site settings → Environment variables
2. Add each variable:
   - `LANGFLOW_ENDPOINT`
   - `LANGFLOW_API_KEY`
   - `NEXT_PUBLIC_LANGFLOW_FLOW_ID`
3. Click "Save"
4. Trigger a new deployment

**Via Netlify CLI:**
```bash
netlify env:set LANGFLOW_ENDPOINT "https://your-langflow-instance.com"
netlify env:set LANGFLOW_API_KEY "your-api-key"
netlify env:set NEXT_PUBLIC_LANGFLOW_FLOW_ID "your-flow-id"
```

## Important Notes

### Edge Functions & Streaming
- The API route uses `maxDuration = 30` for streaming responses
- This is configured automatically via Next.js Edge Runtime
- Netlify's `@netlify/plugin-nextjs` handles this automatically

### Build Configuration
The `netlify.toml` file includes:
- Build command: `npm run build`
- Node version: 20
- Next.js plugin for optimal deployment
- Security headers
- Edge function configuration for `/api/*` routes

### CORS & Security
- API routes are on the same domain (no CORS issues)
- Security headers are configured in `netlify.toml`
- Langflow API key is kept server-side (secure)

### Custom Domain (Optional)
1. Go to Site settings → Domain management
2. Add your custom domain
3. Configure DNS records as instructed
4. Netlify provides free SSL certificates

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Verify all dependencies are in `package.json`
- Ensure Node version is 20+

### Runtime Errors
- Check Function logs in Netlify dashboard
- Verify environment variables are set correctly
- Ensure `LANGFLOW_ENDPOINT` is accessible from Netlify servers

### Widget Not Loading
- Check browser console for errors
- Verify `NEXT_PUBLIC_LANGFLOW_FLOW_ID` is set (must have `NEXT_PUBLIC_` prefix)
- Check Network tab for failed API calls

### Langflow Connection Issues
- Ensure Langflow endpoint is publicly accessible (not localhost)
- Verify API key is correct
- Check Langflow CORS settings if applicable

## Post-Deployment Testing

1. Open the deployed URL
2. Click the chat button
3. Send a test message
4. Verify AI responses are working
5. Test dark mode toggle
6. Test on mobile devices

## Useful Netlify Commands

```bash
# View deployment logs
netlify logs

# Open site in browser
netlify open:site

# Open admin UI
netlify open:admin

# View environment variables
netlify env:list

# Trigger new deployment
netlify deploy --prod
```

## Monitoring & Analytics

Consider enabling:
- **Netlify Analytics** - Pageviews and performance
- **Function logs** - API route debugging
- **Build notifications** - Email/Slack alerts for build status

## Cost Considerations

Netlify Free Tier includes:
- 100 GB bandwidth/month
- 300 build minutes/month
- Serverless functions (125k requests/month)

For higher traffic, consider upgrading to Pro tier.
