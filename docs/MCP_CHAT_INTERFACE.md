# MCP-Powered Chat Interface 💬🤖

## Overview

एक complete chat interface जो automatically merchant की MCP server से connect होता है और उनकी सभी configured APIs को tools के रूप में use करता है।

## Features

✅ **Dynamic Session Management** - हर chat के लिए unique session  
✅ **Merchant-Specific MCP** - Automatic merchant identification  
✅ **Tool Discovery** - Available tools automatically load होते हैं  
✅ **Real-time Chat** - Instant messaging with AI assistant  
✅ **Tool Execution** - Direct MCP tool calls from chat  
✅ **Message History** - सभी messages database में save होते हैं  
✅ **Beautiful UI** - Modern, responsive design  

## Architecture

```
┌────────────────────────────────────────────────────────┐
│              Frontend (React)                          │
│  ┌──────────────────────────────────────────────┐     │
│  │     MCPChatInterface Component               │     │
│  │  - Session ID                                │     │
│  │  - Merchant ID                               │     │
│  │  - MCP Endpoint                              │     │
│  │  - Available Tools                           │     │
│  └──────────────────────────────────────────────┘     │
└───────────────────────┬────────────────────────────────┘
                        │ REST API
                        ▼
┌────────────────────────────────────────────────────────┐
│           Backend API (/api/chat)                      │
│  ┌──────────────────────────────────────────────┐     │
│  │  Chat Routes:                                │     │
│  │  • POST /sessions - Create session           │     │
│  │  • GET /sessions/:id - Get session details   │     │
│  │  • POST /sessions/:id/messages - Send msg    │     │
│  │  • POST /sessions/:id/chat - Chat with AI    │     │
│  └──────────────────────────────────────────────┘     │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│              MCP Service                               │
│  - Execute tools                                       │
│  - Get merchant tools                                  │
│  - Handle authentication                               │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│            Database (PostgreSQL)                       │
│  - sessions (session data)                             │
│  - chats (message history)                             │
│  - merchants (merchant info)                           │
│  - apis (MCP tools config)                             │
└────────────────────────────────────────────────────────┘
```

## Backend API Endpoints

### 1. Create Session
```
POST /api/chat/sessions
```

एक नया chat session create करता है।

**Request:**
```json
{
  "merchantId": 6
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": 123,
    "merchantId": 6,
    "merchant": {
      "id": 6,
      "name": "MCP Test Store",
      "slug": "mcp-test-store"
    },
    "createdAt": "2025-12-16T10:00:00.000Z",
    "mcpEndpoint": "/api/mcp/6"
  }
}
```

---

### 2. Get Session Details
```
GET /api/chat/sessions/:sessionId
```

Session की पूरी details के साथ available tools की list।

**Response:**
```json
{
  "success": true,
  "session": {
    "id": 123,
    "merchantId": 6,
    "merchant": {
      "id": 6,
      "name": "MCP Test Store",
      "slug": "mcp-test-store"
    },
    "mcpEndpoint": "/api/mcp/6",
    "availableTools": [
      {
        "name": "get_weather",
        "description": "Get current weather"
      },
      {
        "name": "send_email",
        "description": "Send email notification"
      }
    ],
    "messages": [...]
  }
}
```

---

### 3. Send Message
```
POST /api/chat/sessions/:sessionId/messages
```

एक message session में add करता है।

**Request:**
```json
{
  "message": "Hello!",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": 456,
    "role": "user",
    "content": "Hello!",
    "timestamp": "2025-12-16T10:05:00.000Z"
  }
}
```

---

### 4. Chat with AI (with MCP Tools)
```
POST /api/chat/sessions/:sessionId/chat
```

Message भेजता है और optionally MCP tools execute करता है।

**Request:**
```json
{
  "message": "What's the weather in Mumbai?",
  "tools": [
    {
      "name": "get_weather",
      "args": {
        "location": "Mumbai"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "role": "assistant",
    "content": "The weather in Mumbai is...",
    "toolResults": [
      {
        "tool": "get_weather",
        "success": true,
        "data": {
          "temp": 28,
          "condition": "Sunny"
        }
      }
    ],
    "timestamp": "2025-12-16T10:06:00.000Z"
  },
  "mcpEndpoint": "/api/mcp/6",
  "availableToolsEndpoint": "/api/mcp/6/tools"
}
```

---

### 5. Get Chat History
```
GET /api/chat/sessions/:sessionId/messages?limit=50&offset=0
```

Session के सभी messages retrieve करता है।

---

### 6. Get Merchant Sessions
```
GET /api/chat/merchants/:merchantId/sessions?limit=10&offset=0
```

एक merchant के सभी sessions की list।

---

### 7. Delete Session
```
DELETE /api/chat/sessions/:sessionId
```

Session और उसके सभी messages delete करता है।

---

## Frontend Components

### MCPChatInterface Component

Main chat interface component जो merchant-specific MCP से integrate है।

**Props:**
- `merchantId` (required): Merchant की ID
- `merchantName` (required): Merchant का name

**Features:**
1. **Auto Session Creation**: Mount होने पर automatically session create करता है
2. **MCP Tool Loading**: Merchant की सभी available tools load करता है
3. **Real-time Messaging**: Message send/receive करता है
4. **Tool Execution**: MCP tools directly execute कर सकता है
5. **Message History**: सभी messages display करता है with timestamps
6. **Loading States**: Beautiful loading indicators
7. **Error Handling**: User-friendly error messages

**State Management:**
```javascript
const [sessionId, setSessionId] = useState(null);
const [messages, setMessages] = useState([]);
const [inputMessage, setInputMessage] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [availableTools, setAvailableTools] = useState([]);
const [mcpEndpoint, setMcpEndpoint] = useState('');
```

**Example Usage:**
```jsx
import MCPChatInterface from './components/MCPChatInterface';

function App() {
  return (
    <MCPChatInterface
      merchantId={6}
      merchantName="MCP Test Store"
    />
  );
}
```

---

### ChatPage Component

Wrapper component जो merchant selection और chat interface manage करता है।

**Features:**
- Multiple merchant support
- Merchant selector dropdown
- Auto-loads first merchant
- Loading states
- Error handling

---

## Database Schema

### Sessions Table

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Chats Table

```sql
CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  merchant_id INTEGER NOT NULL REFERENCES merchants(id),
  message TEXT NOT NULL,  -- JSON string
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Message JSON Structure:**
```json
{
  "role": "user" | "assistant" | "system",
  "content": "Message text",
  "timestamp": "ISO timestamp",
  "toolResults": [...]  // Optional
}
```

---

## How It Works

### Session Flow

```
1. User opens chat page
   ↓
2. Frontend creates session
   POST /api/chat/sessions
   { merchantId: 6 }
   ↓
3. Backend creates session in DB
   Returns session ID and MCP endpoint
   ↓
4. Frontend loads MCP tools
   GET /api/mcp/6/tools
   ↓
5. Chat is ready with:
   - Session ID
   - Merchant ID
   - MCP endpoint
   - Available tools
```

### Message Flow

```
1. User types message
   ↓
2. Frontend sends to backend
   POST /api/chat/sessions/123/chat
   { message: "Hello" }
   ↓
3. Backend saves user message
   ↓
4. Backend processes message
   (can execute MCP tools if needed)
   ↓
5. Backend generates response
   ↓
6. Backend saves assistant response
   ↓
7. Frontend displays both messages
```

### Tool Execution Flow

```
1. User requests tool execution
   "What's the weather in Mumbai?"
   ↓
2. Backend identifies tool needed
   Tool: get_weather
   Args: { location: "Mumbai" }
   ↓
3. Backend calls MCP service
   POST /api/mcp/6/tools/get_weather
   ↓
4. MCP service executes API call
   ↓
5. Results returned to chat
   ↓
6. Frontend displays results
```

---

## Testing

### Step 1: Start Servers

**Backend:**
```bash
cd be
node src/index.js
```

**Frontend:**
```bash
cd fe
npm run dev
```

### Step 2: Create Test Data

```bash
cd be
node test-mcp-setup.js
```

This creates merchant #6 with 3 tools.

### Step 3: Test Chat Interface

1. Open http://localhost:3000/chat (if route configured)
2. या direct component use करें:

```jsx
<MCPChatInterface
  merchantId={6}
  merchantName="MCP Test Store"
/>
```

### Step 4: Test API Endpoints

**Create Session:**
```bash
curl -X POST http://localhost:3001/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"merchantId": 6}'
```

**Send Message:**
```bash
curl -X POST http://localhost:3001/api/chat/sessions/1/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "role": "user"}'
```

**Chat with Tools:**
```bash
curl -X POST http://localhost:3001/api/chat/sessions/1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Get weather",
    "tools": [{"name": "get_weather", "args": {"location": "Mumbai"}}]
  }'
```

---

## UI Features

### Message Types

1. **User Messages**: Blue bubble, right-aligned
2. **Assistant Messages**: White bubble, left-aligned
3. **System Messages**: Yellow bubble, left-aligned
4. **Error Messages**: Red text in assistant bubble

### Components

1. **Header**:
   - Merchant name
   - Session ID
   - MCP endpoint
   - Tools count
   - Reset button

2. **Tools Panel**:
   - List of available tools
   - Tool names as badges
   - Hover to see description

3. **Messages Area**:
   - Scrollable message list
   - Auto-scroll to bottom
   - Timestamps
   - Tool execution results
   - Loading indicator

4. **Input Area**:
   - Text input
   - Send button
   - Session info
   - Disabled when loading

---

## Integration with LLM

यह chat interface को किसी भी LLM के साथ integrate कर सकते हैं:

```javascript
// In backend chat route
const { Configuration, OpenAIApi } = require('openai');

router.post('/sessions/:sessionId/chat', async (req, res) => {
  // ... existing code ...

  // Get available tools for this merchant
  const { tools } = await mcpService.getMerchantTools(merchantId);

  // Call LLM with tools
  const completion = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: conversationHistory,
    functions: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema
    })),
    function_call: 'auto'
  });

  // If LLM wants to call a tool
  if (completion.data.choices[0].finish_reason === 'function_call') {
    const functionCall = completion.data.choices[0].message.function_call;
    
    // Execute via MCP
    const result = await mcpService.executeTool(
      merchantId,
      functionCall.name,
      JSON.parse(functionCall.arguments)
    );

    // Send result back to LLM
    // ... continue conversation ...
  }
});
```

---

## Next Steps

- [ ] Add LLM integration (OpenAI, Claude, etc.)
- [ ] Add voice input/output
- [ ] Add file upload support
- [ ] Add markdown rendering
- [ ] Add code syntax highlighting
- [ ] Add conversation export
- [ ] Add multi-user support
- [ ] Add typing indicators
- [ ] Add message reactions
- [ ] Add conversation search

---

## Troubleshooting

### Issue: "Session not found"
- Check merchantId is correct
- Verify merchant exists in database
- Check session was created successfully

### Issue: "Tools not loading"
- Verify MCP endpoint is correct
- Check merchant has APIs configured
- Test MCP endpoint directly: `GET /api/mcp/:merchantId/tools`

### Issue: "Messages not saving"
- Check database connection
- Verify session ID is valid
- Check chat table exists

---

**Chat Interface is Ready!** 🎉

Merchants की APIs अब chat के through accessible हैं! 💬🤖

