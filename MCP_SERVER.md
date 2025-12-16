# Dynamic MCP Server - Per Merchant 🚀

## Overview

हर merchant के लिए एक dynamic MCP (Model Context Protocol) server बनाया गया है जो उनकी सभी configured APIs को automatically MCP tools में convert कर देता है।

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Agent / LLM                         │
└───────────────────┬─────────────────────────────────────────┘
                    │ MCP Protocol (SSE/JSON-RPC)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│         /api/mcp/:merchant_id (MCP Server)                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Dynamically Generated Tools from Merchant APIs   │     │
│  │  - tool_1: API Config → MCP Tool                  │     │
│  │  - tool_2: API Config → MCP Tool                  │     │
│  │  - tool_3: API Config → MCP Tool                  │     │
│  └────────────────────────────────────────────────────┘     │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                    │
│  - merchants                                                │
│  - apis (merchant's configured APIs)                        │
│  - credentials (auth configs)                               │
└─────────────────────────────────────────────────────────────┘
```

## Features

✅ **Dynamic Tool Generation**: सभी merchant APIs automatically MCP tools बन जाती हैं  
✅ **Multiple Auth Support**: Bearer, API Key, Basic Auth, Custom Headers  
✅ **Smart Parameter Mapping**: API payload से JSON Schema generation  
✅ **Real-time Execution**: Tools directly API call करते हैं  
✅ **Per-Merchant Isolation**: हर merchant की अपनी MCP server  
✅ **SSE & JSON-RPC Support**: दोनों protocols supported  

## API Endpoints

### 1. MCP Server (SSE)
```
GET /api/mcp/:merchantId
```

MCP protocol के साथ Server-Sent Events stream खोलता है।

**Example:**
```bash
curl -N http://localhost:3001/api/mcp/1
```

**Response:** (SSE Stream)
```
data: {"jsonrpc":"2.0","method":"server/info","params":{...}}

data: {"jsonrpc":"2.0","method":"tools/list","params":{"tools":[...]}}
```

---

### 2. List Tools
```
GET /api/mcp/:merchantId/tools
```

Merchant की सभी available tools की list return करता है।

**Example:**
```bash
curl http://localhost:3001/api/mcp/1/tools
```

**Response:**
```json
{
  "success": true,
  "merchant": {
    "id": 1,
    "name": "Test Merchant",
    "slug": "test-merchant"
  },
  "tools": [
    {
      "name": "send_email",
      "description": "Send email via API",
      "inputSchema": {
        "type": "object",
        "properties": {
          "to": {
            "type": "string",
            "description": "Recipient email"
          },
          "subject": {
            "type": "string",
            "description": "Email subject"
          },
          "body": {
            "type": "string",
            "description": "Email body"
          }
        },
        "required": ["to", "subject", "body"]
      }
    }
  ],
  "count": 1
}
```

---

### 3. Execute Tool
```
POST /api/mcp/:merchantId/tools/:toolName
```

एक specific tool को execute करता है।

**Example:**
```bash
curl -X POST http://localhost:3001/api/mcp/1/tools/send_email \
  -H "Content-Type: application/json" \
  -d '{
    "args": {
      "to": "user@example.com",
      "subject": "Hello",
      "body": "This is a test email"
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "data": {
      "message": "Email sent successfully",
      "id": "email_123"
    },
    "status": 200
  }
}
```

---

### 4. Server Info
```
GET /api/mcp/:merchantId/info
```

MCP server की configuration और capabilities return करता है।

**Example:**
```bash
curl http://localhost:3001/api/mcp/1/info
```

**Response:**
```json
{
  "success": true,
  "server": {
    "name": "Test Merchant MCP Server",
    "version": "1.0.0",
    "merchant": {
      "id": 1,
      "name": "Test Merchant",
      "slug": "test-merchant"
    },
    "capabilities": {
      "tools": true,
      "resources": false,
      "prompts": false
    },
    "toolsCount": 5,
    "endpoint": "/api/mcp/1",
    "toolsEndpoint": "/api/mcp/1/tools",
    "executeEndpoint": "/api/mcp/1/tools/:toolName"
  }
}
```

---

### 5. JSON-RPC Endpoint
```
POST /api/mcp/:merchantId/rpc
```

MCP protocol के साथ JSON-RPC 2.0 requests handle करता है।

**Methods:**
- `server/info` - Server information
- `tools/list` - List all tools
- `tools/call` - Execute a tool

**Example:**
```bash
curl -X POST http://localhost:3001/api/mcp/1/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "send_email",
      "arguments": {
        "to": "user@example.com",
        "subject": "Test",
        "body": "Hello"
      }
    },
    "id": 1
  }'
```

## How It Works

### 1. API to Tool Conversion

जब merchant एक API add करता है database में:

```javascript
// Database में API config
{
  apiType: "send_email",
  config: {
    method: "POST",
    url: "https://api.sendgrid.com/v3/mail/send",
    description: "Send email via SendGrid",
    parameters: {
      to: { type: "string", required: true, description: "Recipient" },
      subject: { type: "string", required: true, description: "Subject" },
      body: { type: "string", required: true, description: "Email body" }
    }
  },
  payload: {
    "personalizations": [{"to": [{"email": "{{to}}"}]}],
    "from": {"email": "noreply@merchant.com"},
    "subject": "{{subject}}",
    "content": [{"type": "text/plain", "value": "{{body}}"}]
  },
  credential: {
    authType: "bearer",
    header: "SG.xyz123..."
  }
}
```

MCP Server automatically इसे tool में convert करता है:

```javascript
{
  name: "send_email",
  description: "Send email via SendGrid",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient" },
      subject: { type: "string", description: "Subject" },
      body: { type: "string", description: "Email body" }
    },
    required: ["to", "subject", "body"]
  }
}
```

### 2. Tool Execution Flow

```
User/AI calls tool
      ↓
MCP Server receives request
      ↓
Fetch API config from database
      ↓
Replace {{placeholders}} with actual values
      ↓
Add authentication headers
      ↓
Make HTTP request to external API
      ↓
Return response
```

### 3. Authentication Support

**Bearer Token:**
```javascript
{
  authType: "bearer",
  header: "your-token"
}
```

**API Key:**
```javascript
{
  authType: "api_key",
  header: "X-API-Key:your-key"
}
```

**Basic Auth:**
```javascript
{
  authType: "basic",
  username: "user",
  password: "pass"
}
```

**Custom Headers:**
```javascript
{
  authType: "custom",
  header: '{"X-Custom":"value","X-Another":"value2"}'
}
```

## Testing the MCP Server

### Step 1: Create a Test Merchant & API

```javascript
// test-setup.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setup() {
  // Create merchant
  const merchant = await prisma.merchant.create({
    data: {
      name: 'Test Store',
      email: 'test@store.com',
      slug: 'test-store',
      type: 'general'
    }
  });

  // Create credential
  const credential = await prisma.credential.create({
    data: {
      merchantId: merchant.id,
      authType: 'api_key',
      header: 'X-API-Key:test-key-123'
    }
  });

  // Create API
  const api = await prisma.api.create({
    data: {
      merchantId: merchant.id,
      authId: credential.id,
      apiType: 'get_weather',
      config: {
        method: 'GET',
        url: 'https://api.weatherapi.com/v1/current.json',
        description: 'Get current weather for a location',
        toolName: 'get_weather',
        parameters: {
          location: {
            type: 'string',
            required: true,
            description: 'City name or coordinates'
          }
        }
      },
      payload: {}
    }
  });

  console.log('✅ Test setup complete!');
  console.log('Merchant ID:', merchant.id);
  console.log('MCP Endpoint:', `http://localhost:3001/api/mcp/${merchant.id}`);
}

setup().finally(() => prisma.$disconnect());
```

Run it:
```bash
cd be
node test-setup.js
```

### Step 2: Test Tools List

```bash
curl http://localhost:3001/api/mcp/1/tools | json_pp
```

### Step 3: Execute Tool

```bash
curl -X POST http://localhost:3001/api/mcp/1/tools/get_weather \
  -H "Content-Type: application/json" \
  -d '{"args": {"location": "Mumbai"}}'
```

### Step 4: Test with AI Agent

MCP server को किसी भी AI agent के साथ integrate करें:

```javascript
// In your AI agent code
const mcpEndpoint = 'http://localhost:3001/api/mcp/1';

// List available tools
const response = await fetch(`${mcpEndpoint}/tools`);
const { tools } = await response.json();

// Execute a tool
const result = await fetch(`${mcpEndpoint}/tools/get_weather`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    args: { location: 'Mumbai' }
  })
});
```

## Database Schema

### APIs Table

| Field      | Type   | Description                       |
|------------|--------|-----------------------------------|
| id         | Int    | Primary key                       |
| merchantId | Int    | Foreign key to merchants          |
| authId     | Int    | Foreign key to credentials        |
| apiType    | String | API identifier/name               |
| config     | JSON   | API configuration (url, method, etc) |
| payload    | JSON   | Request body template             |

### Config JSON Structure

```typescript
{
  method: string;           // HTTP method: GET, POST, PUT, etc.
  url: string;              // API endpoint URL
  description?: string;     // Tool description
  toolName?: string;        // Custom tool name (optional)
  headers?: object;         // Additional headers
  parameters?: {            // Parameter definitions
    [key: string]: {
      type: string;         // Parameter type
      required: boolean;    // Is required?
      description: string;  // Parameter description
    }
  }
}
```

### Payload JSON Structure

Payload में `{{placeholder}}` syntax use करके dynamic values inject कर सकते हैं:

```json
{
  "user": "{{username}}",
  "email": "{{email}}",
  "data": {
    "nested": "{{value}}"
  }
}
```

## Use Cases

### 1. E-commerce APIs
```javascript
// Product search
{
  apiType: "search_products",
  config: {
    method: "GET",
    url: "https://api.store.com/products/search"
  }
}

// Add to cart
{
  apiType: "add_to_cart",
  config: {
    method: "POST",
    url: "https://api.store.com/cart/add"
  },
  payload: {
    "product_id": "{{productId}}",
    "quantity": "{{quantity}}"
  }
}
```

### 2. CRM APIs
```javascript
{
  apiType: "create_lead",
  config: {
    method: "POST",
    url: "https://api.crm.com/leads"
  },
  payload: {
    "name": "{{name}}",
    "email": "{{email}}",
    "phone": "{{phone}}"
  }
}
```

### 3. Notification APIs
```javascript
{
  apiType: "send_sms",
  config: {
    method: "POST",
    url: "https://api.twilio.com/2010-04-01/Accounts/xxx/Messages.json"
  },
  payload: {
    "To": "{{to}}",
    "From": "+1234567890",
    "Body": "{{message}}"
  }
}
```

## Security Considerations

1. **Authentication**: सभी API calls merchant के credentials use करती हैं
2. **Rate Limiting**: Production में rate limiting add करें
3. **Input Validation**: Tool arguments को validate करें
4. **Error Handling**: Sensitive information errors में leak न हो
5. **Logging**: सभी API calls को log करें audit के लिए

## Next Steps

- [ ] Add rate limiting per merchant
- [ ] Add webhook support for async operations
- [ ] Add request/response logging
- [ ] Add tool execution history
- [ ] Add tool usage analytics
- [ ] Add API testing playground
- [ ] Add tool versioning
- [ ] Add tool sharing between merchants

## Troubleshooting

### Issue: "Tool not found"
- Check merchant ID is correct
- Verify API exists in database
- Check toolName in config

### Issue: "Authentication failed"
- Verify credential is linked to API
- Check auth type is correct
- Test API with Postman first

### Issue: "Placeholder not replaced"
- Use correct syntax: `{{paramName}}`
- Ensure parameter is in args
- Check JSON structure

---

**MCP Server is ready!** 🎉

Your merchants can now add APIs and they'll automatically become callable tools! 🚀

