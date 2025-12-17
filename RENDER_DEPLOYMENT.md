# Render.com Deployment Guide

## 🚀 Current Deployment

- **Frontend URL:** https://ai-marketplace-1.onrender.com
- **Backend URL:** https://ai-marketplace-api.onrender.com

## ⚠️ SPA Routing Issue Fix

### Problem
Direct URLs like `/chat/20/43` return 404 on Render.com because it's a Single Page Application (SPA).

### Solution Options

#### Option 1: Using render.yaml (Recommended)

1. The `render.yaml` file in the root directory contains the configuration
2. Push the changes to GitHub
3. Render will automatically detect and apply the configuration
4. The key line is:
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

#### Option 2: Manual Configuration in Render Dashboard

If `render.yaml` doesn't work, configure manually:

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your frontend service: `ai-marketplace-1`
3. Go to **Settings** tab
4. Scroll to **Redirects/Rewrites** section
5. Add a new rewrite rule:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Type:** Rewrite (not redirect)
6. Click **Save Changes**
7. Service will automatically redeploy

#### Option 3: Using _redirects File (Backup)

The `fe/public/_redirects` file is already in place:
```
/*    /index.html   200
```

This works on Netlify and some other platforms. On Render, it should be in the build output (`dist/_redirects`), which it is.

## 🔍 Verification

After deployment, test these URLs:
- ✅ https://ai-marketplace-1.onrender.com/
- ✅ https://ai-marketplace-1.onrender.com/chat/20
- ✅ https://ai-marketplace-1.onrender.com/chat/20/43
- ✅ https://ai-marketplace-1.onrender.com/dashboard
- ✅ https://ai-marketplace-1.onrender.com/settings

All should load without 404 errors.

## 🛠️ Build Configuration

### Frontend Service Settings on Render:

- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment:** `Node`

### Important Files:

1. **`fe/vite.config.js`** - Sets `appType: 'spa'`
2. **`fe/public/_redirects`** - SPA routing rule
3. **`render.yaml`** - Render-specific configuration
4. **`fe/src/config/api.js`** - Backend URL configuration

## 🔄 How to Redeploy

### Automatic (Recommended):
1. Push changes to GitHub main branch
2. Render automatically detects and deploys

### Manual:
1. Go to Render Dashboard
2. Select service (frontend or backend)
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait for build to complete

## 📝 Deployment Checklist

Before deploying:
- [ ] All changes committed and pushed to GitHub
- [ ] `render.yaml` in root directory
- [ ] `_redirects` file in `fe/public/`
- [ ] Backend URL correct in `fe/src/config/api.js`
- [ ] Build passes locally: `npm run build`
- [ ] Environment variables set in Render dashboard

After deploying:
- [ ] Test homepage
- [ ] Test chat URLs with merchant ID and session ID
- [ ] Test dashboard (requires login)
- [ ] Check browser console for API errors
- [ ] Verify backend API calls going to correct URL

## 🐛 Troubleshooting

### Issue: 404 on direct URL access
**Solution:** 
1. Check if `_redirects` is in `dist/` folder after build
2. Add rewrite rule in Render dashboard (see Option 2 above)
3. Use `render.yaml` configuration

### Issue: API calls failing
**Solution:**
1. Check `fe/src/config/api.js` has correct backend URL
2. Verify backend service is running on Render
3. Check CORS settings in backend

### Issue: Blank page after deployment
**Solution:**
1. Check browser console for errors
2. Verify all assets loaded correctly
3. Check if backend API is accessible
4. Verify environment is set to production

## 📚 Additional Resources

- Render SPA Documentation: https://docs.render.com/deploy-spa
- Vite SPA Configuration: https://vitejs.dev/guide/build.html#public-base-path

