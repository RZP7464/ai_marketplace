# 💬 Shareable Chat URL - Complete Guide

## 🎯 Overview

Merchants can now share their AI-powered chat with customers! एक beautiful chat interface जो merchant अपने clients के साथ share कर सकते हैं - बिना किसी login की जरूरत।

---

## 🚀 How to Share Your Chat

### Step 1: Login to Dashboard
```
http://localhost:3000/login
Email: tira2@merchant.local
Password: password123
```

### Step 2: Go to Overview Tab
Dashboard खुलते ही Overview tab default में open होगा।

### Step 3: Scroll to Bottom
"💬 Share Your AI Chat" section दिखेगा - **green/teal gradient** के साथ।

### Step 4: Share Options

#### Option 1: Copy Direct Link
```
Public Chat URL:
http://localhost:3000/chat/tira2

[Copy Link] button
```
- One click से copy हो जाता है
- Customers को भेज दो
- WhatsApp, Email, SMS में share करो

#### Option 2: Embed on Website
```html
<iframe 
  src="http://localhost:3000/chat/tira2" 
  width="100%" 
  height="600" 
  frameborder="0">
</iframe>
```
- Website में paste करो
- Full chat widget बन जाता है
- [Copy Code] button से copy करो

#### Option 3: Generate QR Code
```
[🔲 Generate QR Code] button
```
- QR code खुलता है new tab में
- Print करो या share करो
- Customers scan करें और chat करें

#### Option 4: Preview
```
[🔗 Preview Chat] button
```
- New tab में chat open होता है
- Test करने के लिए perfect
- Customers को exactly यही दिखेगा

---

## 🎨 Shareable Chat Section Features

### Visual Design:
```
╔═══════════════════════════════════════════╗
║  💬 Share Your AI Chat                    ║
║  Share this link with customers...        ║
║                                           ║
║  PUBLIC CHAT URL                          ║
║  ┌─────────────────────────┬──────────┐  ║
║  │ localhost:3000/chat/... │ Copy Link│  ║
║  └─────────────────────────┴──────────┘  ║
║                                           ║
║  EMBED CODE (for your website)            ║
║  ┌─────────────────────────┬──────────┐  ║
║  │ <iframe src="..." />    │ Copy Code│  ║
║  └─────────────────────────┴──────────┘  ║
║                                           ║
║  [Preview Chat] [Generate QR Code]        ║
║                                           ║
║  Stats:                                   ║
║  5 API Tools | Active | AI Powered        ║
╚═══════════════════════════════════════════╝
```

### Features:
- ✅ **Green/Teal Gradient**: Beautiful design
- ✅ **Copy Buttons**: One-click copy
- ✅ **Preview Link**: Test before sharing
- ✅ **QR Generator**: Instant QR codes
- ✅ **Stats Display**: Show capabilities
- ✅ **Embed Code**: Website integration

---

## 🌐 Public Chat Interface

### URL Format:
```
http://localhost:3000/chat/:merchantSlug

Examples:
- http://localhost:3000/chat/tira2
- http://localhost:3000/chat/fashionhub
- http://localhost:3000/chat/techmart
- http://localhost:3000/chat/quickbite
```

### Chat Features:

#### Header:
```
┌─────────────────────────────────────┐
│ [Logo] Tira2                        │
│        aao makeup kre               │
└─────────────────────────────────────┘
```
- Merchant logo/icon
- Display name
- Tagline
- Uses merchant's theme colors

#### Messages:
```
[AI] Hi! I'm tira2's AI assistant.
     How can I help you today?
     5:07 PM

                    I need lipstick [User]
                                 5:07 PM

[AI] I found some great lipsticks...
     5:07 PM
```
- AI messages on left (with bot icon)
- User messages on right
- Timestamps
- Smooth animations
- Auto-scroll

#### Input:
```
┌─────────────────────────────────────┐
│ Type your message...        [Send]  │
│ Powered by AI • tira2               │
└─────────────────────────────────────┘
```
- Clean input field
- Send button
- Branding footer

### Design:
- ✅ **Merchant Colors**: Uses primaryColor & secondaryColor
- ✅ **Responsive**: Works on mobile & desktop
- ✅ **Modern UI**: Gradients, blur effects
- ✅ **Smooth UX**: Loading states, animations
- ✅ **Session Persistence**: Chat history saved

---

## 🔧 Backend Endpoints

### 1. Get Public Merchant Data
```bash
GET /api/merchant/public/:slug

# Example
curl http://localhost:3001/api/merchant/public/tira2 | jq
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 14,
    "name": "tira2",
    "slug": "tira2",
    "displayName": "tira2",
    "logo": null,
    "tagline": "aao makeup kre",
    "welcomeMessage": "hello ",
    "categories": ["👗 Fashion & Apparel", "💄 Health & Beauty"],
    "dynamicSettings": {
      "primaryColor": "#3B82F6",
      "secondaryColor": "#60A5FA",
      "accentColor": "#F472B6"
    }
  }
}
```

**No Auth Required** ✅

### 2. Send Chat Message (Public)
```bash
POST /api/chat/public/:merchantSlug

# Example
curl -X POST 'http://localhost:3001/api/chat/public/tira2' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Show me lipsticks",
    "sessionId": "session_123abc"
  }' | jq
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "I found some great lipsticks for you...",
    "sessionId": "session_123abc"
  }
}
```

**No Auth Required** ✅

---

## 🎯 Use Cases

### 1. **E-commerce**
```
Share: http://localhost:3000/chat/fashionhub

Customer: "Show me jeans under $50"
AI: Uses search_item API → Shows products
```

### 2. **Restaurant**
```
Share: http://localhost:3000/chat/quickbite

Customer: "What's on the menu?"
AI: Shows menu, takes orders, applies coupons
```

### 3. **Tech Store**
```
Share: http://localhost:3000/chat/techmart

Customer: "Looking for gaming laptop"
AI: Searches catalog, recommends, adds to cart
```

### 4. **Beauty/Makeup**
```
Share: http://localhost:3000/chat/tira2

Customer: "Need lipstick for wedding"
AI: Searches products, suggests shades
```

---

## 📊 How It Works

### Flow Diagram:
```
Customer Opens Chat URL
    ↓
Frontend: PublicChat component
    ↓
Fetches: GET /api/merchant/public/:slug
    ↓
Shows: Merchant branding, colors, welcome message
    ↓
Customer Types Message
    ↓
POST /api/chat/public/:merchantSlug
    ↓
Backend: Creates/finds session
    ↓
Saves user message to DB
    ↓
AI Service: Processes message with MCP tools
    ↓
Saves AI response to DB
    ↓
Returns response to frontend
    ↓
Customer Sees Response
```

### Session Management:
```javascript
// Session ID generated once per customer
sessionId = `session_${timestamp}_${random}`

// Stored in localStorage
localStorage.setItem(`chat_session_${merchantSlug}`, sessionId)

// Reused for entire conversation
// All messages linked to same session in DB
```

---

## 🧪 Testing Guide

### Test Merchant: tira2

#### 1. Get Chat URL
```bash
# Login to dashboard
http://localhost:3000/login
Email: tira2@merchant.local
Password: password123

# Overview tab → Scroll down → Copy link
Chat URL: http://localhost:3000/chat/tira2
```

#### 2. Open Chat
```bash
# New browser/incognito tab
http://localhost:3000/chat/tira2

Expected:
- Shows "tira2" header
- Shows tagline: "aao makeup kre"
- Shows welcome: "hello "
- Blue/purple theme colors
```

#### 3. Send Test Messages
```
User: "Hi"
AI: [Responds with greeting]

User: "Show me lipstick"
AI: [Searches using search_item API, returns products]
```

#### 4. Check Session
```bash
# Session ID stored in localStorage
Key: chat_session_tira2
Value: session_1234567890_abc123

# All messages linked to this session in DB
```

---

## 🎨 Customization

### Merchant Branding:
```javascript
// Colors from dynamicSettings
primaryColor: "#3B82F6"
secondaryColor: "#60A5FA"
accentColor: "#F472B6"

// Applied to:
- Header gradient
- AI message icon
- Input focus color
- Buttons
```

### Welcome Message:
```javascript
// From merchant.welcomeMessage
"Hi! I'm tira2's AI assistant. How can I help you today?"

// Customizable in Brand Identity settings
```

### Logo/Icon:
```javascript
// merchant.logo URL or
// First letter of displayName in gradient circle
```

---

## 📱 Responsive Design

### Desktop:
```
┌──────────────────────────────────────┐
│  Header (full width)                 │
├──────────────────────────────────────┤
│  Messages (centered, max-w-4xl)      │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│  Input (centered, max-w-4xl)         │
└──────────────────────────────────────┘
```

### Mobile:
```
┌─────────────────┐
│  Header         │
├─────────────────┤
│  Messages       │
│  (full width)   │
│                 │
│                 │
├─────────────────┤
│  Input          │
└─────────────────┘
```

---

## 🔒 Security & Privacy

### Public Endpoints:
- ✅ **No Auth Required**: Anyone can access
- ✅ **Read-Only Merchant Data**: Safe information
- ✅ **No Sensitive Data**: Only display info exposed
- ✅ **Session Isolated**: Each customer separate

### Data Stored:
```
Session Table:
- id (sessionId)
- merchantId
- createdAt

Message Table:
- id
- sessionId
- content (message text)
- sender (user/assistant)
- metadata (AI info)
- createdAt
```

### What's NOT Exposed:
- ❌ Merchant email
- ❌ API credentials
- ❌ Auth tokens
- ❌ User passwords
- ❌ Internal configs

---

## 💡 Pro Tips

### 1. **Test Before Sharing**
```
Use [Preview Chat] button
→ Opens in new tab
→ Test all features
→ Then share with customers
```

### 2. **QR Code for Physical Store**
```
Generate QR → Print → Display in store
Customers scan → Start chatting instantly
```

### 3. **Embed on Website**
```html
<!-- Add to your website -->
<div id="chat-widget">
  <iframe src="http://localhost:3000/chat/tira2" 
          width="400" height="600" 
          style="border: none; border-radius: 10px;">
  </iframe>
</div>
```

### 4. **Social Media Sharing**
```
Instagram Bio: Chat with our AI → link
WhatsApp Status: Try our AI assistant → link
Facebook Page: Message us → link
```

### 5. **Custom Domain**
```
Production: https://yourdomain.com/chat/tira2
Looks professional for customers
```

---

## 🎊 Summary

### What You Get:
✅ Beautiful public chat interface
✅ No login required for customers
✅ Merchant-branded with colors
✅ AI-powered responses
✅ Session management
✅ Copy link in one click
✅ Embed code for website
✅ QR code generator
✅ Preview before sharing
✅ Mobile responsive
✅ Secure and isolated

### How to Access:
```
1. Dashboard → Overview Tab
2. Scroll to bottom
3. See "💬 Share Your AI Chat"
4. Copy link or embed code
5. Share with customers!
```

### Example URLs:
```
Tira2:      http://localhost:3000/chat/tira2
FashionHub: http://localhost:3000/chat/fashionhub
TechMart:   http://localhost:3000/chat/techmart
QuickBite:  http://localhost:3000/chat/quickbite
```

---

**अब अपने customers के साथ AI chat share करो! 🚀💬**

