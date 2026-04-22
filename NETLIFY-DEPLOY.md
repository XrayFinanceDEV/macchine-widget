# Netlify Deployment Guide

Deploy the AI Chat Widget to Netlify with automatic HTTPS and CDN.

## 🚀 Quick Deploy

### Prerequisites
- GitHub/GitLab/Bitbucket repository with the widget code
- Netlify account (free tier works)
- Open-Notebook API accessible via HTTPS

## Step-by-Step Deployment

### 1. Push to Git Repository

```bash
cd /home/brix-ia/DEV/ai-widget
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ai-widget.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider (GitHub/GitLab/Bitbucket)
4. Select the `ai-widget` repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Branch:** `main`

### 3. Configure Environment Variables

In Netlify Dashboard → **Site settings** → **Environment variables**, add:

```
OPEN_NOTEBOOK_ENDPOINT=https://kpsfinanciallab.w3pro.it:5055
OPEN_NOTEBOOK_NOTEBOOK_ID=notebook:wcey1gczvhr6vbdxyyn5
OPEN_NOTEBOOK_STRATEGY_MODEL=model:0thy08wqjik4v5y6ftqq
OPEN_NOTEBOOK_CHAT_MODEL=model:0thy08wqjik4v5y6ftqq
NODE_ENV=production
```

**Important:** Replace `notebook:wcey1gczvhr6vbdxyyn5` and model IDs with your actual IDs.

### 4. Deploy

Click **"Deploy site"**. Netlify will:
- Install dependencies
- Build the Next.js app
- Deploy to CDN
- Assign a URL like `https://your-widget-abc123.netlify.app`

### 5. Custom Domain (Optional)

**Option A: Netlify Subdomain**
1. Go to **Site settings** → **Domain management**
2. Click **"Edit site name"**
3. Choose: `your-widget.netlify.app`

**Option B: Custom Domain**
1. Click **"Add custom domain"**
2. Enter: `chat.kpsfinanciallab.w3pro.it`
3. Follow DNS configuration instructions
4. Netlify provides free SSL certificate automatically

## 🔧 Configuration for WordPress Embed

### Update embed.js baseUrl

After deployment, update your WordPress embed script:

```html
<script>
  window.AIWidgetConfig = {
    baseUrl: 'https://your-widget.netlify.app'
  };
</script>
<script src="https://your-widget.netlify.app/embed.js"></script>
```

### CORS Configuration

The `netlify.toml` is already configured to allow embedding from:
- `https://kpsfinanciallab.w3pro.it`

To add more domains, edit `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://kpsfinanciallab.w3pro.it, https://your-other-domain.com"
```

## 🔄 Continuous Deployment

Every time you push to the `main` branch, Netlify automatically:
1. ✅ Pulls latest code
2. ✅ Runs build
3. ✅ Deploys to production
4. ✅ Updates CDN

**Deploy Previews:**
- Pull requests get preview URLs automatically
- Test changes before merging

## 🛡️ Security Best Practices

### 1. Secure Open-Notebook API

Ensure your Open-Notebook endpoint uses HTTPS:
```
✅ https://kpsfinanciallab.w3pro.it:5055
❌ https://kpsfinanciallab.w3pro.it:5055 (won't work from Netlify)
```

### 2. Restrict CORS Origins

In `netlify.toml`, only allow your WordPress domain:
```toml
Access-Control-Allow-Origin = "https://kpsfinanciallab.w3pro.it"
```

### 3. Environment Variables

Never commit `.env.local` or `.env.production` to Git.
Always use Netlify's Environment Variables UI.

### 4. Open-Notebook Authentication

If your Open-Notebook API requires authentication:

**Option A: Password Header**
```typescript
// app/api/chat/route.ts
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.OPEN_NOTEBOOK_PASSWORD}`
}
```

**Option B: IP Whitelist**
Configure Open-Notebook to only accept requests from Netlify IPs.

## 🚀 Performance Optimization

### Enable Netlify Edge Functions

Already configured in `netlify.toml`:
```toml
[[edge_functions]]
  path = "/api/*"
  function = "nextjs"
```

This runs API routes at the edge for faster responses.

### Caching

Static assets are automatically cached by Netlify CDN.

Custom cache headers in `netlify.toml`:
```toml
[[headers]]
  for = "/embed.js"
  [headers.values]
    Cache-Control = "public, max-age=3600"
```

## 📊 Monitoring

### Netlify Analytics (optional, paid)

Enable in **Site settings** → **Analytics** for:
- Page views
- Unique visitors  
- Top pages
- Bandwidth usage

### Free Alternatives

- Google Analytics
- Plausible
- Simple Analytics

Add tracking code in `app/layout.tsx`.

## 🧪 Testing

### Test the deployed widget

1. **Direct access:** `https://your-widget.netlify.app`
2. **Widget page:** `https://your-widget.netlify.app/widget`
3. **Test embed:** `https://your-widget.netlify.app/test-embed.html`

### Test from WordPress

Add the embed script to a test page and verify:
- ✅ Widget button appears
- ✅ Chat opens on click
- ✅ Messages send successfully
- ✅ Sessions persist (cookies work)

### Debug Issues

**Widget doesn't load:**
```bash
# Check build logs in Netlify dashboard
# Look for errors in "Deploy log"
```

**CORS errors:**
```javascript
// Check browser console (F12)
// Should see no "Access-Control-Allow-Origin" errors
```

**API errors:**
```bash
# Test Open-Notebook endpoint directly
curl https://kpsfinanciallab.w3pro.it:5055/health
```

## 🔄 Rollback

If a deploy breaks something:

1. Go to **Deploys** tab in Netlify
2. Find the last working deploy
3. Click **⋯** → **"Publish deploy"**

This instantly reverts to the previous version.

## 📱 Mobile Testing

Netlify provides instant preview URLs. Test on:
- iOS Safari
- Android Chrome
- Mobile responsive mode in DevTools

## 🆘 Troubleshooting

### Build fails on Netlify

**Error:** `MODULE_NOT_FOUND`
**Fix:** Make sure all dependencies are in `package.json`:
```bash
npm install --save [missing-package]
git commit -am "Add missing dependency"
git push
```

### Environment variables not working

**Issue:** Variables not available during build

**Fix:** In Netlify dashboard, make sure variables are set in:
- **Site settings** → **Environment variables** (not in `netlify.toml`)

### Cookie/Session issues

**Issue:** Sessions don't persist across page reloads

**Fix:** Ensure `sameSite: 'lax'` in cookie settings:
```typescript
// app/api/chat/route.ts
cookieStore.set(SESSION_COOKIE, sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24
})
```

### Slow API responses

**Issue:** 10+ second delays

**Possible causes:**
1. Open-Notebook API is slow
2. Cold start on Open-Notebook
3. Network latency

**Fix:** Add request timeout:
```typescript
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000) // 30 second timeout
})
```

## 🔗 Useful Links

- [Netlify Docs](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Custom Domains](https://docs.netlify.com/domains-https/custom-domains/)

## 📧 Support

- Netlify Support: [support.netlify.com](https://support.netlify.com)
- Open-Notebook Issues: [GitHub](https://github.com/lfnovo/open-notebook/issues)

---

**Next Steps:**
1. ✅ Deploy to Netlify
2. ✅ Configure environment variables  
3. ✅ Get your deployment URL
4. ✅ Update WordPress embed script
5. ✅ Test on your website
