# MCP Tool Filtering - Only Configured APIs

## Overview

**IMPORTANT**: The chat interface only shows MCP tools for APIs that have been configured in the database. If a merchant has not set up an API configuration, its tool will NOT appear in the chat.

## How It Works

### 1. Database-Driven Tool Discovery

When a chat session loads available tools, the system:

1. **Queries the database** for APIs configured for that specific merchant
2. **Filters** to only include APIs with valid `payload` and `config` 
3. **Verifies** each API has valid credentials
4. **Converts** only those configured APIs to MCP tools
5. **Returns** the filtered list to the chat interface

### 2. Code Flow

#### Backend (API Routes)
```
GET /api/mcp/:merchantId/tools
↓
mcpRoutes.js → getToolsHandler()
↓
mcpService.getMerchantTools(merchantId)
↓
Prisma query: merchant.apis (filtered by merchantId)
↓
Returns ONLY tools for APIs in database
```

#### Backend (Service Layer)
File: `be/src/services/mcpService.js`

```javascript
// ONLY fetches APIs configured in database for THIS merchant
const merchant = await prisma.merchant.findUnique({
  where: { id: parseInt(merchantId) },
  include: {
    apis: {
      where: {
        payload: { not: null },
        config: { not: null }
      },
      include: {
        credential: true
      }
    }
  }
});
```

**Key Points:**
- ✅ Only includes APIs from `apis` table for the merchant
- ✅ Filters out APIs with null payload or config
- ✅ Requires valid credentials
- ❌ Does NOT return all possible tools
- ❌ Does NOT show tools for unconfigured APIs

#### Frontend (Chat Interface)
File: `fe/src/components/MCPChatInterface.jsx`

```javascript
// Fetch tools - returns ONLY tools for APIs configured in database
const response = await fetch(`${API_BASE_URL}/api/mcp/${merchantId}/tools`);
```

**UI Behavior:**
- Shows tools as badges when available
- Shows warning message when no tools are configured
- Displays count of available tools

### 3. What This Means

#### ✅ Tools WILL Appear If:
- Merchant has configured the API in the dashboard
- API configuration exists in `apis` table
- API has valid `payload` and `config` JSON
- API has associated credential in `credentials` table
- Credential has valid auth type and headers

#### ❌ Tools WILL NOT Appear If:
- Merchant hasn't configured any APIs
- API configuration is missing from database
- API payload or config is null
- No credential is associated with the API
- Database query returns empty result

## Example Scenarios

### Scenario 1: New Merchant (No APIs)
```
Database: apis table = empty for merchant
Result: No tools available
UI: Shows warning "No tools available. Please configure APIs in dashboard."
```

### Scenario 2: Merchant with Shopify API
```
Database: apis table has 1 entry (Shopify API)
  - apiType: "shopify"
  - payload: { name: "search_products", url: "...", ... }
  - config: { ... }
  - credential: { authType: "bearer", ... }
Result: 1 tool available ("search_products")
UI: Shows badge "search_products"
```

### Scenario 3: Merchant with Multiple APIs
```
Database: apis table has 3 entries
  - Shopify Products API
  - Razorpay Payments API
  - Custom Order API
Result: 3 tools available
UI: Shows 3 badges with tool names
```

## Testing the Filtering

### Test 1: Check Empty State
1. Create a new merchant (don't configure APIs)
2. Go to chat page
3. **Expected**: Warning message showing no tools available

### Test 2: Add API and Verify
1. Go to merchant dashboard
2. Configure a Shopify API
3. Save configuration
4. Go to chat page
5. **Expected**: Tool appears in the available tools list

### Test 3: Check Backend Logs
1. Open chat page
2. Check backend console logs
3. **Expected Output**:
```
=== Getting MCP Tools for Merchant 1 ===
✅ Found merchant: Test Store (test-store)
📦 APIs configured in database: 2
  ✓ API 1: type=shopify, name=search_products, hasCredential=true
  ✓ API 2: type=razorpay, name=create_payment, hasCredential=true
🔧 Converted 2 configured APIs to MCP tools
   Tools available: search_products, create_payment
```

### Test 4: Database Query
```sql
-- Check what APIs are configured for a merchant
SELECT 
  m.name as merchant_name,
  a.api_type,
  a.payload->>'name' as tool_name,
  c.auth_type
FROM merchants m
LEFT JOIN apis a ON m.id = a.merchant_id
LEFT JOIN credentials c ON a.auth_id = c.id
WHERE m.id = 1;
```

## API Configuration Tables

### `apis` Table
Stores API configurations for merchants:
- `merchant_id`: Links to merchant
- `api_type`: Type of API (shopify, razorpay, etc.)
- `payload`: JSON with API details (url, method, params, etc.)
- `config`: JSON with tool configuration
- `auth_id`: Links to credential

### `credentials` Table
Stores authentication credentials:
- `merchant_id`: Links to merchant
- `auth_type`: bearer, api_key, basic, custom
- `header`: Auth header value
- `username`/`password`: For basic auth

## Troubleshooting

### Problem: No tools showing up
**Check:**
1. Are there records in the `apis` table for this merchant?
2. Do the APIs have valid `payload` and `config`?
3. Is there a linked credential (`auth_id`)?
4. Check backend logs for error messages

### Problem: Some tools missing
**Check:**
1. Verify the API configuration in database
2. Check if `payload.name` is set correctly
3. Verify credential exists and is valid
4. Check backend logs for filtering messages

### Problem: Wrong tools showing up
**This should not happen** - tools are strictly filtered by merchant ID.
If you see tools from another merchant:
1. Check if merchant IDs are mixed up
2. Verify session/authentication
3. Check database foreign keys

## Code References

### Key Files
- `/be/src/routes/mcp.js` - API endpoints for tool listing
- `/be/src/services/mcpService.js` - Tool fetching and filtering logic
- `/fe/src/components/MCPChatInterface.jsx` - Frontend tool display
- `/be/prisma/schema.prisma` - Database schema

### Key Functions
- `mcpService.getMerchantTools(merchantId)` - Fetches and filters tools
- `getToolsHandler()` - API route handler with verification
- `loadMCPTools()` - Frontend function to fetch tools

## Summary

🔒 **Security**: Tools are isolated per merchant - you only see your own configured APIs

📦 **Database-Driven**: All tools come from the `apis` table - no hardcoded lists

✅ **Verified**: Multiple layers of filtering ensure only valid, configured APIs become tools

🎯 **Clear Feedback**: UI shows warnings when no APIs are configured

💡 **Easy to Extend**: Add new API in dashboard → automatically becomes a tool

