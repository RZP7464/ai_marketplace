# 🎯 Cursor MCP Config - Quick Guide

## 🚀 How to Get MCP Config for All Merchants

### ✨ New Feature: One-Click Config Copy!

Ab tumhe manually JSON generate nahi karna padega! Login page pe hi button hai! 🎉

---

## 📍 Location

```
Frontend: http://localhost:3000/login
```

**देखो login form के नीचे:**
- Green/Teal gradient button
- Text: "Copy Cursor MCP Config"

---

## 🎬 Step-by-Step Usage

### Step 1: Open Login Page
```
http://localhost:3000/login
```

### Step 2: Click the Button
- Look for the **green button** below the login form
- Says: "Copy Cursor MCP Config"
- Click it!

### Step 3: Modal Opens
Beautiful modal shows:
- 📊 **Stats**: Total merchants, base URL, servers count
- 📋 **Instructions**: Step-by-step setup guide
- 📦 **Merchant List**: All available merchant servers
- 🎨 **JSON Config**: Formatted and ready to copy

### Step 4: Copy or Download
Two options:
1. **Copy to Clipboard** (recommended)
   - Click "Copy to Clipboard" button
   - Pastes directly in Cursor settings
   
2. **Download JSON**
   - Click "Download" button
   - Saves as `cursor-mcp-config.json`
   - Open and copy later

### Step 5: Configure Cursor
1. Open Cursor IDE
2. Press `Cmd + ,` (Mac) or `Ctrl + ,` (Windows)
3. Search for "mcp"
4. Click "Edit in settings.json"
5. Add the copied JSON:
```json
{
  "mcpServers": {
    // PASTE HERE
  }
}
```
6. Save file
7. Restart Cursor IDE

### Step 6: Test in Cursor
1. Open Cursor chat
2. Type `@`
3. See all merchant servers!
4. Select one and ask questions

---

## 🎨 Modal Features

### Top Section (Stats Cards)
```
┌─────────────────┬─────────────────┬─────────────────┐
│ Total Merchants │    Base URL     │   Config Size   │
│       5         │ localhost:3001  │   5 servers     │
└─────────────────┴─────────────────┴─────────────────┘
```

### Instructions Box
```
📋 Setup Instructions

1. Copy the 'mcpServers' object from the config below
2. Open Cursor IDE Settings (Cmd/Ctrl + ,)
3. Search for 'mcp' in settings
4. Click 'Edit in settings.json'
5. Add or merge the mcpServers configuration
6. Save and restart Cursor IDE
7. Test by typing '@' in Cursor chat
```

### Action Buttons
```
┌───────────────────────────────┬─────────────┐
│  [Copy] Copy to Clipboard     │  [↓] Download │
└───────────────────────────────┴─────────────┘
```

### JSON Display
```json
{
  "mcpServers": {
    "fashionhub": {
      "command": "node",
      "args": [...],
      "env": {...}
    },
    "techmart": {...},
    "quickbite": {...},
    "tira2": {...}
  }
}
```

### Merchant List
```
┌─────────────────────────────────────────┐
│ fashionhub                              │
│ FashionHub                              │
│ Slug: fashionhub                        │
└─────────────────────────────────────────┘
```

---

## 🔧 Backend Endpoint

### Direct API Call (Alternative Method)
If you want to fetch directly:

```bash
curl http://localhost:3001/api/mcp/cursor-config | jq
```

**Response:**
```json
{
  "success": true,
  "config": {
    "mcpServers": {
      "fashionhub": {...},
      "techmart": {...},
      "quickbite": {...},
      "tira2": {...}
    }
  },
  "instructions": [...],
  "merchantCount": 5,
  "baseUrl": "http://localhost:3001"
}
```

---

## 📋 Example Config (Generated)

```json
{
  "mcpServers": {
    "fashionhub": {
      "command": "node",
      "args": [
        "/path/to/mcp-client-wrapper.js",
        "10"
      ],
      "env": {
        "MERCHANT_ID": "10",
        "MERCHANT_NAME": "FashionHub",
        "MERCHANT_SLUG": "fashionhub",
        "API_BASE_URL": "http://localhost:3001"
      }
    },
    "techmart": {
      "command": "node",
      "args": [
        "/path/to/mcp-client-wrapper.js",
        "11"
      ],
      "env": {
        "MERCHANT_ID": "11",
        "MERCHANT_NAME": "TechMart",
        "MERCHANT_SLUG": "techmart",
        "API_BASE_URL": "http://localhost:3001"
      }
    },
    "tira2": {
      "command": "node",
      "args": [
        "/path/to/mcp-client-wrapper.js",
        "14"
      ],
      "env": {
        "MERCHANT_ID": "14",
        "MERCHANT_NAME": "tira2",
        "MERCHANT_SLUG": "tira2",
        "API_BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

---

## 🎯 What Gets Included?

### Automatic Filtering:
- ✅ Only merchants **with APIs configured**
- ✅ Valid merchant slug (converted to server name)
- ✅ Proper wrapper script path
- ✅ All environment variables

### What's Generated:
```javascript
For each merchant:
  - Server name (slug with underscores)
  - Node command
  - Wrapper script path
  - Merchant ID
  - Merchant name
  - Merchant slug
  - API base URL
```

---

## 🧪 Testing

### Test the Endpoint:
```bash
# Get full config
curl http://localhost:3001/api/mcp/cursor-config | jq

# Get just merchant count
curl http://localhost:3001/api/mcp/cursor-config | jq '.merchantCount'

# Get just merchant names
curl http://localhost:3001/api/mcp/cursor-config | jq '.config.mcpServers | keys'
```

### Test in Browser:
```
http://localhost:3001/api/mcp/cursor-config
```

---

## 🎨 UI Screenshots (Text)

### Login Page Button:
```
┌────────────────────────────────────────┐
│                                        │
│         [Login Form Here]              │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  📋 Copy Cursor MCP Config      │  │
│  │                                  │  │
│  │  Get MCP configuration for all   │  │
│  │  merchants to use with Cursor    │  │
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

### Modal View:
```
╔════════════════════════════════════════╗
║  Cursor IDE MCP Configuration          ║
║  Copy this config to integrate all     ║
║  merchants with Cursor                 ║
╠════════════════════════════════════════╣
║  Stats:                                ║
║  • 5 merchants                         ║
║  • localhost:3001                      ║
║  • 5 servers                           ║
║                                        ║
║  Instructions:                         ║
║  1. Copy the mcpServers...            ║
║  2. Open Cursor Settings...           ║
║  ...                                  ║
║                                        ║
║  [Copy to Clipboard] [Download]       ║
║                                        ║
║  {                                     ║
║    "mcpServers": {                    ║
║      "fashionhub": {...},            ║
║      ...                              ║
║    }                                  ║
║  }                                    ║
║                                        ║
║  Merchants:                            ║
║  • fashionhub (FashionHub)            ║
║  • techmart (TechMart)                ║
║  • tira2 (tira2)                      ║
╚════════════════════════════════════════╝
```

---

## 🚦 Status Indicators

### In Modal:
- 🔄 **Loading**: "Loading configuration..."
- ✅ **Success**: Shows config with copy button
- ❌ **Error**: Red error message with retry
- 📋 **Copied**: "Copied!" confirmation (2 seconds)

---

## 💡 Pro Tips

1. **Auto-Updates**: Config is generated **dynamically**
   - Always reflects current merchants in DB
   - Automatically includes new merchants with APIs
   
2. **Only Active Merchants**: 
   - Only merchants with APIs are included
   - Ensures Cursor doesn't show empty servers

3. **Easy Testing**:
   - Open modal on login page
   - No need to login first
   - Public endpoint (no auth required)

4. **Offline Use**:
   - Download JSON for later
   - Share with team members
   - Keep as backup

---

## 🔗 Related Files

### Frontend:
```
fe/src/components/CursorConfigModal.jsx  - Modal component
fe/src/pages/AuthPage.jsx               - Login page with button
```

### Backend:
```
be/src/routes/mcp.js                    - /cursor-config endpoint
be/mcp-client-wrapper.js                - Wrapper script
```

---

## 🎯 Quick Access

### Open Modal:
1. Go to: http://localhost:3000/login
2. Click green button at bottom
3. Done! 🎉

### Get JSON (API):
```bash
curl http://localhost:3001/api/mcp/cursor-config
```

---

## ✨ Features Summary

✅ **One-click copy** - No manual config needed
✅ **Beautiful UI** - Modern modal design
✅ **Copy to clipboard** - Instant paste
✅ **Download option** - Save for later
✅ **Instructions included** - Step-by-step guide
✅ **Dynamic generation** - Always up to date
✅ **Merchant filtering** - Only active merchants
✅ **Visual feedback** - Success/error states
✅ **Responsive design** - Works on all screens
✅ **No auth required** - Public endpoint

---

## 🎊 Enjoy Your Easy MCP Setup!

**पूरा config अब एक click में! 🚀**

