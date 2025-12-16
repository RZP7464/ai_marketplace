# 🌱 Database Seeder

Comprehensive database seeder with realistic mock data for AI Marketplace.

## Quick Start

```bash
# Run the seeder
npm run db:seed

# OR
npm run prisma:seed

# OR with Prisma CLI
npx prisma db seed
```

## What Gets Created

### 📊 Overview

- **3 Merchants** - Different e-commerce types
- **5 Auth Credentials** - Various authentication methods
- **11 APIs** - Real working APIs with proper tools
- **3 AI Configurations** - Gemini AI setup for each merchant
- **6 Users** - Test users (2 per merchant)
- **3 Chat Sessions** - With sample conversations
- **10 Chat Messages** - Realistic chat history

---

## 🏪 Merchants

### 1. FashionHub 👗
**E-commerce: Fashion & Apparel**

- **Email**: `admin@fashionhub.com`
- **Slug**: `fashionhub`
- **Categories**: Clothing, Accessories, Footwear, Jewelry
- **Theme**: Pink/Rose (#FF6B9D)
- **APIs**: 4 endpoints (products, categories, order)
- **Auth**: No Auth + API Key

**APIs Available:**
- `get_products` - Fetch all fashion products
- `get_product_by_id` - Get product details
- `get_categories` - List all categories
- `create_order` - Place new order

### 2. TechMart 📱
**E-commerce: Electronics & Gadgets**

- **Email**: `admin@techmart.com`
- **Slug**: `techmart`
- **Categories**: Smartphones, Laptops, Tablets, Accessories, Gaming
- **Theme**: Blue (#4A90E2)
- **APIs**: 3 endpoints (search, products, cart)
- **Auth**: No Auth + Bearer Token

**APIs Available:**
- `search_electronics` - Search for products
- `get_product_details` - Get detailed specs
- `add_to_cart` - Add items to cart

### 3. QuickBite 🍕
**E-commerce: Food Delivery**

- **Email**: `admin@quickbite.com`
- **Slug**: `quickbite`
- **Categories**: Pizza, Burgers, Indian, Chinese, Desserts
- **Theme**: Orange (#FF9500)
- **APIs**: 3 endpoints (restaurants, menu, order)
- **Auth**: Basic Authentication

**APIs Available:**
- `get_restaurants` - List restaurants
- `get_menu` - Get restaurant menu
- `place_order` - Place food order

---

## 🔑 Authentication Types

Each merchant has different auth setups to test various scenarios:

1. **No Auth** - Public APIs
2. **API Key** - Header-based authentication
3. **Bearer Token** - OAuth-style authentication
4. **Basic Auth** - Username/Password authentication

---

## 👥 Test Users

All users have the same password: **`password123`**

### FashionHub Users
- `john@example.com` - John Doe
- `jane@example.com` - Jane Smith

### TechMart Users
- `mike@example.com` - Mike Johnson
- `sarah@example.com` - Sarah Williams

### QuickBite Users
- `david@example.com` - David Brown
- `emily@example.com` - Emily Davis

---

## 🤖 AI Configurations

All merchants are pre-configured with **Gemini AI**:

- **Provider**: Gemini
- **Model**: gemini-pro
- **Status**: Active
- **Config**: Temperature 0.7-0.9, Max Tokens 1024-2048

**Note**: Update `GEMINI_API_KEY` in `.env` for AI features to work.

---

## 💬 Sample Chat Sessions

Each merchant has a chat session with sample conversations:

### FashionHub
- User asks about trending products
- Bot uses `get_products` tool
- User asks about categories
- Bot uses `get_categories` tool

### TechMart
- User asks for laptop recommendations
- Bot uses `search_electronics` tool

### QuickBite
- User asks about restaurants
- Bot uses `get_restaurants` tool
- User orders pizza
- Bot uses `place_order` tool

---

## 🔗 API Endpoints

### Merchant-Specific MCP Endpoints

```bash
# FashionHub
http://localhost:3001/api/mcp/merchants/7/tools

# TechMart
http://localhost:3001/api/mcp/merchants/8/tools

# QuickBite
http://localhost:3001/api/mcp/merchants/9/tools
```

### Test MCP Tools

```bash
# Get FashionHub tools
curl http://localhost:3001/api/mcp/merchants/7/tools | jq

# Execute a tool
curl -X POST http://localhost:3001/api/mcp/merchants/7/execute \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "get_products",
    "parameters": { "limit": 5 }
  }'
```

---

## 🎨 Dynamic Settings

Each merchant has unique branding:

| Merchant    | Primary Color | Secondary Color | Accent Color |
|-------------|---------------|-----------------|--------------|
| FashionHub  | #FF6B9D       | #C44569         | #FFA07A      |
| TechMart    | #4A90E2       | #357ABD         | #5DADE2      |
| QuickBite   | #FF9500       | #FF6B35         | #FFB84D      |

---

## 🧪 Testing Scenarios

### 1. Test Authentication
```bash
# Test API with no auth
curl https://fakestoreapi.com/products

# Test API with basic auth (QuickBite)
curl -u quickbite_user:quickbite_pass https://dummyjson.com/recipes
```

### 2. Test MCP Integration
```bash
# Start chat session
curl -X POST http://localhost:3001/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"merchantId": 7}'

# Send message
curl -X POST http://localhost:3001/api/chat/sessions/1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me all products",
    "merchantId": 7
  }'
```

### 3. Test AI Settings
```bash
# Get AI providers
curl http://localhost:3001/api/settings/ai/providers

# Get merchant AI config
curl http://localhost:3001/api/settings/merchants/7/ai

# Test API key
curl -X POST http://localhost:3001/api/settings/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gemini",
    "apiKey": "your-api-key",
    "model": "gemini-pro"
  }'
```

---

## 🔄 Re-seeding

To clear and re-seed the database:

```bash
# Run seeder (it auto-clears existing data)
npm run db:seed
```

The seeder automatically:
1. ✅ Clears all existing data
2. ✅ Creates fresh mock data
3. ✅ Maintains referential integrity
4. ✅ Hashes passwords securely

---

## 📝 Notes

### External APIs Used
- **FakeStore API**: Fashion products
- **DummyJSON**: Electronics and recipes
- All APIs are free and publicly available

### Customization
Edit `prisma/seed.js` to:
- Add more merchants
- Change product categories
- Modify AI configurations
- Add more chat conversations
- Change authentication types

### Merchant IDs
Note: Merchant IDs may vary. Check the output after seeding to get correct IDs for API calls.

---

## 🚀 Next Steps

1. **Start the backend**: `npm run dev`
2. **Test MCP endpoints**: Use the URLs from seeder output
3. **Login as merchant**: Use merchant emails
4. **Test chat interface**: Send messages via API
5. **Configure AI**: Update API keys in settings

---

## 🐛 Troubleshooting

### Seeder fails with connection error
```bash
# Check DATABASE_URL in .env
# Ensure database is accessible
```

### Foreign key constraint errors
```bash
# Clear data manually first
npx prisma migrate reset
npm run db:seed
```

### API key validation fails
```bash
# Update GEMINI_API_KEY in .env
# Or add AI config via settings API
```

---

**Happy Testing!** 🎉

