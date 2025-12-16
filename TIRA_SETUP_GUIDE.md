# 🎯 Tira Merchant Setup Guide

Complete guide to set up Tira merchant with authentication.

## ⚠️ Issue

Your API call is failing because you need **JWT authentication token** in the request.

## ✅ Solution - Step by Step

### Step 1: Register/Login to Get Token

First, you need to authenticate and get a JWT token.

#### Option A: Register New Merchant

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tira",
    "email": "admin@tira.com",
    "password": "tira123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 13,
    "name": "Tira",
    "email": "admin@tira.com",
    "merchantId": 13
  }
}
```

#### Option B: Login (if already registered)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tira.com",
    "password": "tira123"
  }'
```

### Step 2: Save the Token

Copy the `token` value from the response. Example:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzLCJtZXJjaGFudElkIjoxMywiZW1haWwiOiJhZG1pbkB0aXJhLmNvbSIsImlhdCI6MTYzOTQ4MjY0MCwiZXhwIjoxNjQwMDg3NDQwfQ.abc123...
```

### Step 3: Complete Setup with Token

Now use the token in your request:

```bash
curl -X POST http://localhost:3001/api/merchant/complete-setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --data-raw '{
    "brandData": {
      "display_logo": {},
      "display_name": "tira",
      "display_tagline": "aao makeup kre",
      "display_message": "search lipstick",
      "display_category": ["👗 Fashion & Apparel", "💎 Jewelry & Accessories"],
      "primary_color": "#3B82F6",
      "secondary_color": "#60A5FA",
      "accent_color": "#F472B6"
    },
    "apiConfigs": {
      "search_item": {
        "url": "https://www.tiraz5.de/ext/plpoffers/application/api/v1.0/products",
        "method": "GET",
        "headers": [
          {"key": "accept", "value": "application/json, text/plain, */*"},
          {"key": "authorization", "value": "Bearer NjJjNDUwM2IwYjJlOTcxMWQ5OWI4NWFhOmtXRDFWeks4Yg=="},
          {"key": "x-currency-code", "value": "INR"}
        ],
        "params": [
          {"key": "page_id", "value": "0"},
          {"key": "page_size", "value": "12"},
          {"key": "q", "value": "{{search_query}}"}
        ],
        "body": ""
      }
    }
  }'
```

---

## 🔄 Complete Flow Example

### Full Script

```bash
#!/bin/bash

# Step 1: Register
echo "Registering Tira merchant..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tira",
    "email": "admin@tira.com",
    "password": "tira123"
  }')

# Extract token
TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Got token: ${TOKEN:0:20}..."

# Step 2: Complete setup
echo "Completing setup..."
curl -X POST http://localhost:3001/api/merchant/complete-setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  --data-raw '{
    "brandData": {
      "display_logo": {},
      "display_name": "Tira",
      "display_tagline": "Aao makeup kre",
      "display_message": "Search for your favorite lipstick",
      "display_category": ["👗 Fashion & Apparel", "💎 Jewelry & Accessories"],
      "primary_color": "#3B82F6",
      "secondary_color": "#60A5FA",
      "accent_color": "#F472B6"
    },
    "apiConfigs": {
      "search_item": {
        "url": "https://www.tiraz5.de/ext/plpoffers/application/api/v1.0/products",
        "method": "GET",
        "headers": [
          {"key": "accept", "value": "application/json, text/plain, */*"},
          {"key": "authorization", "value": "Bearer NjJjNDUwM2IwYjJlOTcxMWQ5OWI4NWFhOmtXRDFWeks4Yg=="},
          {"key": "x-currency-code", "value": "INR"}
        ],
        "params": [
          {"key": "page_id", "value": "0"},
          {"key": "page_size", "value": "12"},
          {"key": "q", "value": "{{search_query}}"}
        ],
        "body": ""
      }
    }
  }' | jq

echo "Setup complete!"
```

---

## 📝 API Configuration Details

### Your Tira API

The API will be saved with:

**Tool Name**: `search`
**Description**: Search for products
**Method**: GET
**URL**: `https://www.tiraz5.de/ext/plpoffers/application/api/v1.0/products`

**Parameters**:
- `page_id`: 0
- `page_size`: 12
- `q`: `{{search_query}}` (dynamic placeholder)

**Headers**:
- `accept`: application/json
- `authorization`: Bearer token
- `x-currency-code`: INR

---

## 🧪 Test Tira MCP

After setup, test your MCP:

### 1. Get Merchant Info
```bash
curl http://localhost:3001/api/mcp/merchants/13/info | jq
```

### 2. List Tools
```bash
curl http://localhost:3001/api/mcp/merchants/13/tools | jq
```

### 3. Search Products
```bash
curl -X POST http://localhost:3001/api/mcp/merchants/13/tools/search \
  -H "Content-Type: application/json" \
  -d '{"args": {"q": "lipstick"}}' | jq
```

---

## 🎨 Frontend Login Flow

If using frontend:

1. **Navigate to**: http://localhost:3000/login
2. **Register/Login** with:
   - Email: `admin@tira.com`
   - Password: `tira123`
3. **Token is automatically stored** in localStorage
4. **Complete setup** from dashboard

---

## 🔧 Troubleshooting

### "Unauthorized" or "No token provided"

**Fix**: Include Authorization header
```bash
-H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### "Merchant not found"

**Fix**: Token might be expired or invalid. Login again.

### "API configuration failed"

**Check**:
1. URL is valid
2. Headers are correct
3. Params format is right

---

## 📊 Expected Result

After successful setup:

```json
{
  "success": true,
  "data": {
    "merchant": {
      "id": 13,
      "name": "Tira",
      "email": "admin@tira.com",
      "displayName": "Tira",
      "tagline": "Aao makeup kre",
      "categories": ["👗 Fashion & Apparel", "💎 Jewelry & Accessories"]
    },
    "dynamicSettings": {
      "primaryColor": "#3B82F6",
      "secondaryColor": "#60A5FA",
      "accentColor": "#F472B6"
    },
    "apis": [
      {
        "id": 14,
        "apiType": "search",
        "merchantId": 13
      }
    ]
  },
  "message": "Setup completed successfully"
}
```

---

## 🌐 Tira MCP Endpoints

After setup, these will be available:

```
Info:   http://localhost:3001/api/mcp/merchants/13/info
Tools:  http://localhost:3001/api/mcp/merchants/13/tools
Stream: http://localhost:3001/api/mcp/merchants/13/stream
```

---

## 🎯 Use in Cursor

Add to Cursor settings:

```json
{
  "mcpServers": {
    "ai-marketplace-tira": {
      "command": "node",
      "args": [
        "/Users/himanshu.shekhar/Desktop/workspace/mcp-research/hackthon-rzp/ai_marketplace/be/mcp-client-wrapper.js",
        "13",
        "http://localhost:3001"
      ],
      "env": {
        "MERCHANT_ID": "13",
        "MERCHANT_NAME": "Tira",
        "MERCHANT_SLUG": "tira",
        "BASE_URL": "http://localhost:3001"
      },
      "description": "Tira - Makeup & Cosmetics",
      "disabled": false
    }
  }
}
```

---

**Now your Tira merchant will be set up! 🎉**

