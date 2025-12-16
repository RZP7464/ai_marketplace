# 🧪 AI Marketplace - Test URLs

Both servers are running! Use these URLs to test the application.

## 🚀 Running Servers

✅ **Backend**: http://localhost:3001 (Running)
✅ **Frontend**: http://localhost:3000 (Running)

---

## 🌐 Frontend URLs

### Main Application
```
http://localhost:3000
```

### Authentication
```
http://localhost:3000/login
http://localhost:3000/register
```

### Merchant Dashboard
```
http://localhost:3000/dashboard
```

### API Configuration
```
http://localhost:3000/api-config
```

### Brand Identity
```
http://localhost:3000/brand
```

---

## 🔌 Backend API Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### Authentication

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fashionhub.com",
    "password": "password123"
  }'
```

**Register:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "merchantId": 10
  }'
```

---

## 🏪 MCP Endpoints

### List All MCP Servers
```bash
curl http://localhost:3001/api/mcp/servers | jq
```
**Response:** List of all merchant MCP servers (FashionHub, TechMart, QuickBite)

### MCP Health Check
```bash
curl http://localhost:3001/api/mcp/health | jq
```

---

## 👗 FashionHub (Merchant ID: 10)

### Get Server Info
```bash
curl http://localhost:3001/api/mcp/merchants/10/info | jq
```

### List Tools
```bash
curl http://localhost:3001/api/mcp/merchants/10/tools | jq
```

### Get Products
```bash
curl -X POST http://localhost:3001/api/mcp/merchants/10/tools/get_products \
  -H "Content-Type: application/json" \
  -d '{"args": {}}' | jq
```

### Get Categories
```bash
curl -X POST http://localhost:3001/api/mcp/merchants/10/tools/get_categories \
  -H "Content-Type: application/json" \
  -d '{"args": {}}' | jq
```

### Get Product by ID
```bash
curl -X POST http://localhost:3001/api/mcp/merchants/10/tools/get_product_by_id \
  -H "Content-Type: application/json" \
  -d '{"args": {"product_id": "1"}}' | jq
```

### SSE Stream (in browser or with curl)
```bash
curl -N http://localhost:3001/api/mcp/merchants/10/stream
```

---

## 📱 TechMart (Merchant ID: 11)

### Get Server Info
```bash
curl http://localhost:3001/api/mcp/merchants/11/info | jq
```

### List Tools
```bash
curl http://localhost:3001/api/mcp/merchants/11/tools | jq
```

### Search Electronics
```bash
curl -X POST http://localhost:3001/api/mcp/merchants/11/tools/search_electronics \
  -H "Content-Type: application/json" \
  -d '{"args": {"q": "laptop"}}' | jq
```

### Get Product Details
```bash
curl -X POST http://localhost:3001/api/mcp/merchants/11/tools/get_product_details \
  -H "Content-Type: application/json" \
  -d '{"args": {"id": 1}}' | jq
```

---

## 🍕 QuickBite (Merchant ID: 12)

### Get Server Info
```bash
curl http://localhost:3001/api/mcp/merchants/12/info | jq
```

### List Tools
```bash
curl http://localhost:3001/api/mcp/merchants/12/tools | jq
```

### Get Restaurants
```bash
curl -X POST http://localhost:3001/api/mcp/merchants/12/tools/get_restaurants \
  -H "Content-Type: application/json" \
  -d '{"args": {}}' | jq
```

### Get Menu
```bash
curl -X POST http://localhost:3001/api/mcp/merchants/12/tools/get_menu \
  -H "Content-Type: application/json" \
  -d '{"args": {"recipe_id": 1}}' | jq
```

---

## 💬 Chat API

### Create Session
```bash
curl -X POST http://localhost:3001/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"merchantId": 10}' | jq
```

### Send Message
```bash
curl -X POST http://localhost:3001/api/chat/sessions/1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me fashion products",
    "merchantId": 10
  }' | jq
```

### Get Chat History
```bash
curl http://localhost:3001/api/chat/sessions/1?merchantId=10 | jq
```

---

## ⚙️ Settings API

### Get AI Providers
```bash
curl http://localhost:3001/api/settings/ai/providers | jq
```

### Get Merchant AI Config
```bash
curl http://localhost:3001/api/settings/merchants/10/ai | jq
```

### Test API Key
```bash
curl -X POST http://localhost:3001/api/settings/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "apiKey": "your-api-key",
    "model": "gemini-pro"
  }' | jq
```

---

## 🧪 Test Credentials

### Merchant Logins
```
Email: admin@fashionhub.com
Email: admin@techmart.com
Email: admin@quickbite.com
Password: (no password in seeder, will need to register first)
```

### User Logins
```
Email: john@example.com
Email: jane@example.com
Email: mike@example.com
Email: sarah@example.com
Email: david@example.com
Email: emily@example.com
Password: password123
```

---

## 🎯 Quick Test Commands

### Test Everything at Once

```bash
# Health checks
echo "=== Health Check ===" && \
curl -s http://localhost:3001/health | jq && \

echo "\n=== MCP Health ===" && \
curl -s http://localhost:3001/api/mcp/health | jq && \

echo "\n=== All MCP Servers ===" && \
curl -s http://localhost:3001/api/mcp/servers | jq && \

echo "\n=== FashionHub Tools ===" && \
curl -s http://localhost:3001/api/mcp/merchants/10/tools | jq '.tools[].name' && \

echo "\n=== Get Categories ===" && \
curl -s -X POST http://localhost:3001/api/mcp/merchants/10/tools/get_categories \
  -H "Content-Type: application/json" \
  -d '{"args": {}}' | jq '.result.data'
```

---

## 🧰 Useful Tools

### Prisma Studio (Database GUI)
```bash
cd be
npm run prisma:studio
```
Opens at: http://localhost:5555

### MCP Stream Test Client
```bash
cd be
node test-mcp-stream.js 10
```

### Generate Cursor Config
```bash
cd be
node generate-cursor-config.js
```

---

## 📊 Database Data

### Merchants
- **FashionHub** (ID: 10) - 4 APIs
- **TechMart** (ID: 11) - 3 APIs
- **QuickBite** (ID: 12) - 3 APIs

### Users (6 total)
- 2 per merchant
- Password: `password123`

### APIs (11 total)
- Various auth types: None, API Key, Bearer, Basic
- Real external APIs (FakeStore, DummyJSON)

---

## 🎨 Frontend Features to Test

### 1. Merchant Dashboard
- View merchant info
- Manage APIs
- Configure branding

### 2. API Configuration
- Add new APIs
- Test API endpoints
- Configure authentication

### 3. Brand Identity
- Upload logo
- Set colors
- Customize theme

### 4. Chat Interface (if implemented)
- Start conversation
- Test MCP tools
- View tool calls

---

## 🔍 Browser DevTools

### Network Tab
Watch API calls:
1. Open DevTools (F12)
2. Network tab
3. Filter: XHR/Fetch
4. Watch requests to localhost:3001

### Console
Check for errors:
1. Console tab
2. Look for errors (red)
3. Check MCP connection logs

---

## 📝 Test Scenarios

### Scenario 1: Fashion Shopping
1. Open http://localhost:3000
2. Login as john@example.com
3. Browse products from FashionHub
4. View categories
5. Check product details

### Scenario 2: Electronics Search
1. Test TechMart MCP:
   ```bash
   curl -X POST http://localhost:3001/api/mcp/merchants/11/tools/search_electronics \
     -H "Content-Type: application/json" \
     -d '{"args": {"q": "phone"}}'
   ```

### Scenario 3: Food Ordering
1. Get restaurants from QuickBite
2. View menu
3. Place order (test API)

---

## 🐛 Troubleshooting

### Backend Not Responding
```bash
# Check if running
curl http://localhost:3001/health

# Restart if needed
cd be
pkill -f "node src/index.js"
node src/index.js
```

### Frontend Not Loading
```bash
# Check if running
curl http://localhost:3000

# Restart if needed
cd fe
npm run dev
```

### Database Issues
```bash
# Check connection
cd be
npm run prisma:studio

# Reseed if needed
npm run db:seed
```

---

## 📚 Documentation Links

- **Setup Guide**: `/docs/SETUP_COMPLETE.md`
- **MCP Streaming**: `/docs/MCP_STREAMING.md`
- **Cursor Setup**: `/docs/CURSOR_SETUP.md`
- **Seeder Guide**: `/docs/SEED_README.md`
- **API Integration**: `/docs/API_INTEGRATION.md`

---

**Happy Testing! 🎉**

