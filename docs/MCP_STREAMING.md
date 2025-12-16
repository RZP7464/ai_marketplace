# 🌊 Streamable HTTP Remote MCP Server

Complete guide for HTTP-based streaming MCP (Model Context Protocol) servers for each merchant.

## 🎯 Overview

Every merchant in the AI Marketplace gets their own **remote MCP server** accessible via:
- **Server-Sent Events (SSE)** - Real-time streaming
- **JSON-RPC** - Request/response API
- **REST endpoints** - Simple HTTP access

Each merchant's APIs are automatically exposed as MCP tools that AI models can call.

---

## 🚀 Quick Start

### List All Available MCP Servers

```bash
curl http://localhost:3001/api/mcp/servers | jq
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "servers": [
    {
      "merchantId": 10,
      "merchantName": "FashionHub",
      "merchantSlug": "fashionhub",
      "apisCount": 4,
      "mcpEndpoint": "/api/mcp/merchants/10/stream",
      "mcpUrl": "http://localhost:3001/api/mcp/merchants/10/stream"
    }
  ]
}
```

### Get MCP Server Info

```bash
curl http://localhost:3001/api/mcp/merchants/10/info | jq
```

**Response:**
```json
{
  "success": true,
  "type": "mcp-server",
  "protocol": "http-sse",
  "merchant": {
    "id": 10,
    "name": "FashionHub",
    "slug": "fashionhub"
  },
  "endpoints": {
    "stream": "/api/mcp/merchants/10/stream",
    "rpc": "/api/mcp/merchants/10/rpc",
    "tools": "/api/mcp/merchants/10/tools"
  },
  "capabilities": {
    "tools": true,
    "streaming": true,
    "jsonRpc": true
  },
  "tools": {
    "count": 4,
    "available": ["get_products", "get_product_by_id", "get_categories", "create_order"]
  }
}
```

---

## 📡 SSE Stream Endpoint

### Connect to MCP Stream

```bash
curl -N http://localhost:3001/api/mcp/merchants/10/stream
```

**Stream Events:**

```
event: server-info
data: {
  "protocolVersion": "2024-11-05",
  "capabilities": {...},
  "serverInfo": {...}
}

event: tools-list
data: {
  "tools": [...]
}

event: heartbeat
data: {
  "timestamp": "2024-12-16T10:00:00.000Z",
  "status": "connected"
}
```

### JavaScript/TypeScript Client

```javascript
const EventSource = require('eventsource');

const merchantId = 10;
const streamUrl = `http://localhost:3001/api/mcp/merchants/${merchantId}/stream`;
const eventSource = new EventSource(streamUrl);

// Server info
eventSource.addEventListener('server-info', (event) => {
  const data = JSON.parse(event.data);
  console.log('Server:', data.serverInfo.name);
  console.log('Protocol:', data.protocolVersion);
});

// Tools list
eventSource.addEventListener('tools-list', (event) => {
  const data = JSON.parse(event.data);
  console.log('Available tools:', data.tools.length);
  data.tools.forEach(tool => {
    console.log(`- ${tool.name}: ${tool.description}`);
  });
});

// Heartbeat
eventSource.addEventListener('heartbeat', (event) => {
  const data = JSON.parse(event.data);
  console.log('Heartbeat:', data.timestamp);
});

// Error handling
eventSource.onerror = (error) => {
  console.error('Connection error:', error);
  eventSource.close();
};
```

### Python Client

```python
import requests
import json

def connect_mcp_stream(merchant_id):
    url = f'http://localhost:3001/api/mcp/merchants/{merchant_id}/stream'
    
    with requests.get(url, stream=True) as response:
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                
                if line.startswith('event: '):
                    event = line.split('event: ')[1]
                    
                elif line.startswith('data: '):
                    data = json.loads(line.split('data: ')[1])
                    print(f'{event}: {data}')

# Connect to FashionHub MCP
connect_mcp_stream(10)
```

---

## 🔌 JSON-RPC Endpoint

### Initialize

```bash
curl -X POST http://localhost:3001/api/mcp/merchants/10/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {},
    "id": 1
  }' | jq
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": { "listChanged": true }
    },
    "serverInfo": {
      "name": "FashionHub MCP Server",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

### List Tools

```bash
curl -X POST http://localhost:3001/api/mcp/merchants/10/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }' | jq
```

### Call Tool

```bash
curl -X POST http://localhost:3001/api/mcp/merchants/10/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_categories",
      "arguments": {}
    },
    "id": 3
  }' | jq
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[\"electronics\",\"jewelery\",\"men's clothing\",\"women's clothing\"]"
      }
    ],
    "isError": false
  },
  "id": 3
}
```

---

## 🛠️ REST Endpoints

### List Tools

```bash
GET /api/mcp/merchants/:merchantId/tools
```

```bash
curl http://localhost:3001/api/mcp/merchants/10/tools | jq
```

### Execute Tool

```bash
POST /api/mcp/merchants/:merchantId/tools/:toolName
Body: { "args": {...} }
```

```bash
curl -X POST http://localhost:3001/api/mcp/merchants/10/tools/get_categories \
  -H "Content-Type: application/json" \
  -d '{"args": {}}' | jq
```

### Health Check

```bash
GET /api/mcp/health
```

```bash
curl http://localhost:3001/api/mcp/health | jq
```

---

## 🧪 Testing

### Run Test Suite

```bash
cd be
node test-mcp-stream.js 10
```

This will test:
- ✅ List all MCP servers
- ✅ Get server info
- ✅ SSE stream connection
- ✅ Tool execution
- ✅ JSON-RPC endpoints

### Test Different Merchants

```bash
# FashionHub (Merchant ID: 10)
node test-mcp-stream.js 10

# TechMart (Merchant ID: 11)
node test-mcp-stream.js 11

# QuickBite (Merchant ID: 12)
node test-mcp-stream.js 12
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         AI Client (Claude, GPT)         │
│                                         │
│  Supports: SSE, JSON-RPC, REST          │
└────────────────┬────────────────────────┘
                 │
                 │ HTTP/SSE
                 ▼
┌─────────────────────────────────────────┐
│      MCP Server (per merchant)          │
│                                         │
│  • SSE Stream: Real-time events         │
│  • JSON-RPC: Request/response           │
│  • REST: Simple HTTP calls              │
└────────────────┬────────────────────────┘
                 │
                 │ Dynamic Tool Generation
                 ▼
┌─────────────────────────────────────────┐
│       Merchant APIs (Database)          │
│                                         │
│  • GET /products                        │
│  • POST /orders                         │
│  • GET /categories                      │
│  • etc...                               │
└─────────────────────────────────────────┘
```

---

## 📋 Protocol Details

### MCP Protocol Version
- **Version**: 2024-11-05
- **Transport**: HTTP with SSE
- **Format**: JSON-RPC 2.0

### Capabilities

| Feature | Supported |
|---------|-----------|
| Tools | ✅ Yes |
| Tool List Changes | ✅ Yes |
| Prompts | ❌ No |
| Resources | ❌ No |
| Streaming | ✅ Yes |

### Events

| Event | Description |
|-------|-------------|
| `server-info` | Server initialization data |
| `tools-list` | Available tools |
| `heartbeat` | Keep-alive ping (every 30s) |

---

## 🔐 Authentication

Currently, the MCP server endpoints are:
- **Public** - No authentication required for MCP protocol endpoints
- **Per-Tool Auth** - Each tool (API) uses its configured authentication:
  - No Auth
  - API Key
  - Bearer Token
  - Basic Auth

To add MCP-level authentication, modify the routes to include JWT or API key validation.

---

## 🌐 Integration Examples

### With Claude (Anthropic)

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  tools: [
    {
      name: 'get_products',
      description: 'Get all fashion products with optional filters',
      input_schema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Filter by category' },
          limit: { type: 'number', description: 'Limit results' }
        }
      }
    }
  ],
  messages: [
    { role: 'user', content: 'Show me electronics products' }
  ]
});

// Handle tool calls
if (message.stop_reason === 'tool_use') {
  const toolUse = message.content.find(block => block.type === 'tool_use');
  
  // Call MCP tool
  const result = await fetch(
    `http://localhost:3001/api/mcp/merchants/10/tools/${toolUse.name}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: toolUse.input })
    }
  );
}
```

### With OpenAI

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'What categories do you have?' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_categories',
        description: 'Get all available product categories',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    }
  ]
});

// Handle function calls
if (completion.choices[0].finish_reason === 'tool_calls') {
  const toolCall = completion.choices[0].message.tool_calls[0];
  
  // Call MCP tool
  const result = await fetch(
    `http://localhost:3001/api/mcp/merchants/10/tools/${toolCall.function.name}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: JSON.parse(toolCall.function.arguments) })
    }
  );
}
```

---

## 🚀 Deployment

### Production Considerations

1. **Add Authentication**
   - API keys for MCP endpoints
   - JWT tokens for merchant isolation

2. **Rate Limiting**
   - Limit SSE connections per merchant
   - Rate limit tool executions

3. **Monitoring**
   - Track SSE connection count
   - Monitor tool execution times
   - Log failed tool calls

4. **Scaling**
   - Use Redis for SSE connection management
   - Load balance across multiple servers
   - Cache tool definitions

5. **Security**
   - Validate all tool inputs
   - Sanitize responses
   - Enable CORS properly
   - Use HTTPS in production

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3001/api/mcp/health
```

### Metrics to Track

- Active SSE connections
- Tool execution count
- Tool execution duration
- Error rates
- Merchant-specific usage

---

## 🐛 Troubleshooting

### SSE Connection Fails

```bash
# Check if server is running
curl http://localhost:3001/api/mcp/health

# Test with verbose curl
curl -v -N http://localhost:3001/api/mcp/merchants/10/stream
```

### Tool Execution Fails

```bash
# List available tools first
curl http://localhost:3001/api/mcp/merchants/10/tools | jq

# Check tool name spelling
# Verify tool arguments match schema
```

### No Merchants Available

```bash
# Run database seeder
cd be
npm run db:seed
```

---

## 📚 Resources

- **MCP Specification**: https://modelcontextprotocol.io
- **Server-Sent Events**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- **JSON-RPC 2.0**: https://www.jsonrpc.org/specification

---

**Built with ❤️ for AI Marketplace**

