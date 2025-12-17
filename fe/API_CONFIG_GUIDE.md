# Backend API Configuration Guide

## 📍 Single Source of Truth

**All backend API URLs are now managed from ONE location:**

```
fe/src/config/api.js
```

## 🔧 How It Works

### Configuration File (`fe/src/config/api.js`)

```javascript
const getApiBaseUrl = () => {
  // Production: Use production backend
  if (import.meta.env.PROD) {
    return 'https://ai-marketplace-api.onrender.com';
  }

  // Development: Use local backend
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();
```

### Environment Detection

- **Production Build** (`npm run build`): Uses `https://ai-marketplace-api.onrender.com`
- **Development Mode** (`npm run dev`): Uses `http://localhost:3001`

## 📂 Files Using API Configuration

All these files import from `config/api.js`:

1. ✅ `services/api.js` - Main API service
2. ✅ `pages/ChatPage.jsx`
3. ✅ `components/MCPChatInterface.jsx`
4. ✅ `pages/AISettings.jsx`
5. ✅ `pages/MerchantDashboardComplete.jsx`
6. ✅ `pages/MerchantSettings.jsx`
7. ✅ `pages/PublicChat.jsx`
8. ✅ `components/CursorConfigModal.jsx`
9. ✅ `pages/SettingsPage.jsx`

## 🚫 Deprecated

The following are **NO LONGER USED**:
- ❌ `.env.production` (deleted)
- ❌ `VITE_API_URL` environment variable (deprecated)
- ❌ `VITE_MCP_SERVER_URL` environment variable (deprecated)

## 🔄 How to Change Backend URL

### For Development (Local):
Edit `fe/src/config/api.js` line 11:
```javascript
return 'http://localhost:3001';
```

### For Production:
Edit `fe/src/config/api.js` line 7:
```javascript
return 'https://ai-marketplace-api.onrender.com';
```

## 🎯 Deployment

When deploying to Render.com:
1. No environment variables needed for API URL
2. Code automatically detects production mode
3. Uses correct backend URL from `config/api.js`

## 🐛 Debugging

To debug API configuration, add this to your component:

```javascript
import { debugApiConfig } from './config/api';

// In your component
useEffect(() => {
  debugApiConfig();
}, []);
```

This will log:
- Environment (development/production)
- Detected API_BASE_URL
- Current Host

## 📝 Summary

✅ **One config file** - `fe/src/config/api.js`  
✅ **Automatic detection** - Based on build mode  
✅ **No env variables** - Simplified configuration  
✅ **Easy to maintain** - Single place to update URLs

