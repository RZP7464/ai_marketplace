# 🎯 Dashboard Testing Guide

## 🚀 Complete Flow Test

### ✅ Servers Running
1. **Frontend**: http://localhost:3000
2. **Backend**: http://localhost:3001
3. **Database**: PostgreSQL (Connected via Render)

---

## 📝 Test Scenario 1: New Merchant Signup

### Step 1: Open Frontend
```
http://localhost:3000/login
```

### Step 2: Click "Sign Up" Tab
- No actual API call yet (just goes to onboarding)

### Step 3: Fill Brand Identity
```
http://localhost:3000/onboarding
```
- Enter display name, tagline, message
- Choose colors and categories
- Click "Next"

### Step 4: Configure APIs
```
http://localhost:3000/api-config
```
- Add API configurations
- Can paste curl commands
- Click "Complete Setup"

### Step 5: View Dashboard
```
http://localhost:3000/dashboard
```
- Automatically redirects after setup
- Shows all merchant data from DB

---

## 🔐 Test Scenario 2: Existing Merchant Login

### Test Credentials (from seed data):

#### FashionHub
- **Email**: `fashionhub@merchant.local`
- **Password**: `password123`
- **Merchant ID**: 10

#### TechMart
- **Email**: `techmart@merchant.local`
- **Password**: `password123`
- **Merchant ID**: 11

#### QuickBite
- **Email**: `quickbite@merchant.local`
- **Password**: `password123`
- **Merchant ID**: 12

#### Tira2 (Your created one)
- **Email**: `tira2@merchant.local`
- **Password**: `password123`
- **Merchant ID**: 14

### Login Flow:
1. Go to: http://localhost:3000/login
2. Enter email and password
3. Click "Login"
4. **Redirects to Dashboard**: http://localhost:3000/dashboard

---

## 🎨 Dashboard Features

### 1. **Overview Tab** (Default)
Shows 3 cards:
- **Merchant Info**: ID, Email, Type, Created Date
- **Brand Details**: Tagline, Welcome Message, Categories
- **Theme Colors**: Primary, Secondary, Accent (with color preview)

### 2. **Brand Tab**
Complete brand identity:
- Display Name
- Tagline
- Welcome Message
- Description
- Website
- Phone
- Address

### 3. **APIs Tab**
All configured APIs:
- API Name & Description
- HTTP Method
- URL
- Headers (truncated)
- Parameters
- "Add API" button

### 4. **Settings Tab**
Dynamic Settings:
- All settings from dynamicSettings table
- Color configurations
- Custom settings

### 5. **MCP Tab**
MCP Integration:
- Server Info endpoint
- Tools List endpoint
- SSE Stream endpoint
- "Open Tools Endpoint" button

---

## 🧪 Backend API Tests

### 1. Login Test
```bash
curl -X POST 'http://localhost:3001/api/auth/login' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "email": "tira2@merchant.local",
    "password": "password123"
  }' | jq
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJ...",
    "user": {
      "id": 19,
      "name": "tira2 Admin",
      "email": "tira2@merchant.local",
      "merchant": {
        "id": 14,
        "name": "tira2",
        "slug": "tira2"
      }
    }
  }
}
```

### 2. Get Merchant Data (with auth)
```bash
TOKEN="YOUR_TOKEN_FROM_LOGIN"
curl -X GET 'http://localhost:3001/api/merchant' \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 14,
    "name": "tira2",
    "slug": "tira2",
    "displayName": "tira2",
    "email": "tira2@merchant.local",
    "tagline": "aao makeup kre",
    "welcomeMessage": "hello",
    "categories": ["👗 Fashion & Apparel", "💄 Health & Beauty"],
    "dynamicSettings": {
      "primaryColor": "#3B82F6",
      "secondaryColor": "#60A5FA",
      "accentColor": "#F472B6"
    },
    "apis": [
      {
        "id": 25,
        "apiType": "search",
        "payload": {
          "name": "search",
          "url": "https://www.tiraz5.de/...",
          "method": "GET",
          "headers": [...],
          "params": [...]
        }
      }
    ],
    "users": [
      {
        "id": 19,
        "name": "tira2 Admin",
        "email": "tira2@merchant.local"
      }
    ],
    "aiConfigurations": []
  }
}
```

### 3. Complete Setup (Create New Merchant)
```bash
curl -X POST 'http://localhost:3001/api/merchant/complete-setup' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "brandData": {
      "display_name": "TestStore",
      "display_tagline": "Your trusted store",
      "display_message": "Welcome!",
      "display_category": ["🛒 E-commerce"],
      "primary_color": "#3B82F6",
      "secondary_color": "#60A5FA",
      "accent_color": "#F472B6"
    },
    "apiConfigs": {
      "search_item": {
        "url": "https://api.example.com/search",
        "method": "GET",
        "headers": [],
        "params": [{"key": "q", "value": "{{query}}"}],
        "body": ""
      }
    }
  }' | jq
```

### 4. MCP Endpoints
```bash
# List all MCP servers
curl http://localhost:3001/api/mcp/servers | jq

# Get merchant MCP info
curl http://localhost:3001/api/mcp/merchants/14/info | jq

# List merchant tools
curl http://localhost:3001/api/mcp/merchants/14/tools | jq
```

---

## 🐛 Troubleshooting

### Frontend Not Loading?
```bash
cd fe
npm install
npm run dev
```

### Backend Not Running?
```bash
cd be
npm install
npx prisma generate
node src/index.js
```

### Database Connection Issues?
```bash
cd be
npx prisma db push
npx prisma studio  # View database in browser
```

### Can't Login?
Make sure you're using the correct credentials from seed data or create a new merchant via complete-setup endpoint.

---

## 📊 Database Check

### View All Merchants
```bash
cd be
npx prisma studio
```
Then open: http://localhost:5555

---

## ✨ Key Features Working

✅ **Auto Merchant Creation**: No manual ID needed
✅ **Complete Onboarding Flow**: Signup → Brand → APIs → Dashboard
✅ **Full Data Display**: All merchant data from DB in one dashboard
✅ **MCP Integration**: All APIs exposed as MCP tools
✅ **Beautiful UI**: Modern design with theme colors
✅ **Logout**: Clear auth and redirect to login

---

## 🎯 Next Steps

1. **Test complete signup flow** from scratch
2. **Login with existing merchant** and view dashboard
3. **Check MCP endpoints** are working
4. **Verify all tabs** show correct data
5. **Test logout** functionality

---

## 📞 Support

If you encounter any issues:
1. Check browser console (F12)
2. Check backend terminal for errors
3. Verify database connection
4. Check JWT token is being stored in localStorage

**All systems are GO! 🚀**

