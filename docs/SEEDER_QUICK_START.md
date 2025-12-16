# 🚀 Seeder Quick Start Guide

## ⚡ Quick Commands

```bash
# Seed the database
cd be && npm run db:seed

# View data in Prisma Studio
cd be && npm run prisma:studio
```

---

## 🏪 Mock Merchants Created

### 1. 👗 FashionHub
```
Email: admin@fashionhub.com
Type: Fashion E-commerce
APIs: 4 endpoints (products, categories, orders)
Theme: Pink (#FF6B9D)
MCP: http://localhost:3001/api/mcp/merchants/7/tools
```

### 2. 📱 TechMart
```
Email: admin@techmart.com
Type: Electronics Store
APIs: 3 endpoints (search, products, cart)
Theme: Blue (#4A90E2)
MCP: http://localhost:3001/api/mcp/merchants/8/tools
```

### 3. 🍕 QuickBite
```
Email: admin@quickbite.com
Type: Food Delivery
APIs: 3 endpoints (restaurants, menu, orders)
Theme: Orange (#FF9500)
MCP: http://localhost:3001/api/mcp/merchants/9/tools
```

---

## 🔐 Test Credentials

### User Login
```
Email: john@example.com (or any from the list)
Password: password123
```

**Available Users:**
- `john@example.com`, `jane@example.com` (FashionHub)
- `mike@example.com`, `sarah@example.com` (TechMart)
- `david@example.com`, `emily@example.com` (QuickBite)

---

## 🧪 Quick API Tests

### Test FashionHub MCP
```bash
# Get tools
curl http://localhost:3001/api/mcp/merchants/7/tools | jq

# Execute tool
curl -X POST http://localhost:3001/api/mcp/merchants/7/execute \
  -H "Content-Type: application/json" \
  -d '{"toolName": "get_products", "parameters": {}}'
```

### Test Chat API
```bash
# Create session
curl -X POST http://localhost:3001/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"merchantId": 7}'

# Send message
curl -X POST http://localhost:3001/api/chat/sessions/1/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me products", "merchantId": 7}'
```

### Test AI Settings
```bash
# Get providers
curl http://localhost:3001/api/settings/ai/providers | jq

# Get merchant AI config
curl http://localhost:3001/api/settings/merchants/7/ai | jq
```

---

## 📊 What's in the Database

```
✓ Merchants: 3 (Fashion, Electronics, Food)
✓ APIs: 11 (Real working endpoints)
✓ Users: 6 (2 per merchant)
✓ AI Configs: 3 (Gemini for all)
✓ Sessions: 3 (With chat history)
✓ Auth Types: 4 (None, API Key, Bearer, Basic)
```

---

## 🎯 Quick Testing Flow

### 1. Start Backend
```bash
cd be
npm run dev
```

### 2. Test MCP Endpoint
```bash
curl http://localhost:3001/api/mcp/merchants/7/tools
```

### 3. Open Prisma Studio
```bash
cd be
npm run prisma:studio
```

### 4. Test Chat Interface
- Navigate to chat page in frontend
- Select a merchant
- Start chatting!

---

## 🔄 Re-seed Database

```bash
cd be
npm run db:seed
```

The seeder automatically clears old data and creates fresh mock data.

---

## 📝 Important Notes

1. **Merchant IDs**: Check seeder output for exact IDs (usually 7, 8, 9)
2. **API Key**: Set `GEMINI_API_KEY` in `.env` for AI features
3. **External APIs**: Uses FakeStore and DummyJSON (free, no auth needed)
4. **Passwords**: All user passwords are `password123`

---

## 📚 Detailed Documentation

See `be/prisma/SEED_README.md` for complete documentation including:
- Full merchant details
- API endpoint specifications
- Authentication examples
- Advanced testing scenarios
- Troubleshooting guide

---

**Ready to test!** 🎉

