#!/bin/bash

# Tira Merchant Setup Script
# Automatically registers and sets up Tira merchant

echo "🎯 Setting up Tira Merchant..."
echo ""

BASE_URL="http://localhost:3001"

# Step 1: Register Tira merchant
echo "📝 Step 1: Registering Tira merchant..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/merchant-register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tira Admin",
    "email": "admin@tira.com",
    "password": "tira123",
    "businessName": "Tira",
    "slug": "tira"
  }')

# Check if registration was successful
SUCCESS=$(echo $REGISTER_RESPONSE | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  echo "⚠️  Registration failed. Trying to login instead..."
  
  # Try login if already registered
  LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@tira.com",
      "password": "tira123"
    }')
  
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
  MERCHANT_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.merchant.id')
else
  TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')
  MERCHANT_ID=$(echo $REGISTER_RESPONSE | jq -r '.data.merchant.id')
fi

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi

echo "✅ Authentication successful!"
echo "Token: ${TOKEN:0:30}..."
echo ""

# Step 2: Complete merchant setup
echo "🔧 Step 2: Completing Tira setup with API configuration..."
SETUP_RESPONSE=$(curl -s -X POST $BASE_URL/api/merchant/complete-setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  --data-raw '{
    "brandData": {
      "display_logo": {},
      "display_name": "Tira",
      "display_tagline": "Aao makeup kre",
      "display_message": "Search for your favorite lipstick",
      "display_category": ["👗 Fashion & Apparel", "💎 Jewelry & Accessories", "💄 Cosmetics"],
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
          {"key": "accept-language", "value": "en-GB,en-US;q=0.9,en;q=0.8"},
          {"key": "authorization", "value": "Bearer NjJjNDUwM2IwYjJlOTcxMWQ5OWI4NWFhOmtXRDFWeks4Yg=="},
          {"key": "x-currency-code", "value": "INR"},
          {"key": "user-agent", "value": "Mozilla/5.0"}
        ],
        "params": [
          {"key": "page_id", "value": "0"},
          {"key": "page_size", "value": "12"},
          {"key": "q", "value": "{{search_query}}"}
        ],
        "body": ""
      }
    }
  }')

SETUP_SUCCESS=$(echo $SETUP_RESPONSE | jq -r '.success')

if [ "$SETUP_SUCCESS" != "true" ]; then
  echo "❌ Setup failed!"
  echo "Response: $SETUP_RESPONSE"
  exit 1
fi

echo "✅ Tira merchant setup complete!"
echo ""

# Get merchant ID if not already set
if [ -z "$MERCHANT_ID" ] || [ "$MERCHANT_ID" == "null" ]; then
  MERCHANT_ID=$(echo $SETUP_RESPONSE | jq -r '.data.merchant.id')
fi

echo "📊 Tira Merchant Details:"
echo "  - Merchant ID: $MERCHANT_ID"
echo "  - Name: Tira"
echo "  - Email: admin@tira.com"
echo "  - Password: tira123"
echo ""

# Step 3: Test MCP endpoints
echo "🧪 Step 3: Testing MCP endpoints..."
echo ""

echo "📍 MCP Info:"
curl -s $BASE_URL/api/mcp/merchants/$MERCHANT_ID/info | jq '.merchant, .tools'

echo ""
echo "🔧 Available Tools:"
curl -s $BASE_URL/api/mcp/merchants/$MERCHANT_ID/tools | jq '.tools[].name'

echo ""
echo "🎯 Test Search (searching for 'lipstick'):"
curl -s -X POST $BASE_URL/api/mcp/merchants/$MERCHANT_ID/tools/search \
  -H "Content-Type: application/json" \
  -d '{"args": {"q": "lipstick"}}' | jq '.result.success, .result.data.data | length'

echo ""
echo "═══════════════════════════════════════════"
echo "✨ Tira Setup Complete!"
echo "═══════════════════════════════════════════"
echo ""
echo "🌐 MCP Endpoints:"
echo "  Info:   $BASE_URL/api/mcp/merchants/$MERCHANT_ID/info"
echo "  Tools:  $BASE_URL/api/mcp/merchants/$MERCHANT_ID/tools"
echo "  Stream: $BASE_URL/api/mcp/merchants/$MERCHANT_ID/stream"
echo ""
echo "🔑 Login Credentials:"
echo "  Email:    admin@tira.com"
echo "  Password: tira123"
echo "  Token:    $TOKEN"
echo ""
echo "🎯 Next Steps:"
echo "  1. Test MCP: curl $BASE_URL/api/mcp/merchants/$MERCHANT_ID/tools"
echo "  2. Add to Cursor: See TIRA_SETUP_GUIDE.md"
echo "  3. Start chatting with Tira's products!"
echo ""

