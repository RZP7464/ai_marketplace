# 🎯 Cursor IDE MCP Setup Guide

Complete guide to add AI Marketplace MCP servers to Cursor IDE.

## 🚀 Quick Setup

### Step 1: Generate Configuration

```bash
cd be
node generate-cursor-config.js
```

This creates two config files:
- `cursor-mcp-config.json` - Node.js wrapper (recommended)
- `cursor-mcp-http-config.json` - Direct HTTP SSE

### Step 2: Open Cursor Settings

1. Open **Cursor Settings** (Cmd/Ctrl + ,)
2. Search for "MCP" or navigate to **Features > MCP**
3. Click on **"Edit in settings.json"**

### Step 3: Add Configuration

Copy the content from one of the generated files and paste it into your Cursor settings.

#### Option A: Node.js Wrapper (Recommended)

```json
{
  "mcpServers": {
    "ai-marketplace-fashionhub": {
      "command": "node",
      "args": [
        "/Users/himanshu.shekhar/Desktop/workspace/mcp-research/hackthon-rzp/ai_marketplace/be/mcp-client-wrapper.js",
        "10",
        "http://localhost:3001"
      ],
      "env": {
        "MERCHANT_ID": "10",
        "MERCHANT_NAME": "FashionHub",
        "MERCHANT_SLUG": "fashionhub",
        "BASE_URL": "http://localhost:3001"
      },
      "description": "FashionHub - 4 APIs available",
      "disabled": false
    },
    "ai-marketplace-techmart": {
      "command": "node",
      "args": [
        "/Users/himanshu.shekhar/Desktop/workspace/mcp-research/hackthon-rzp/ai_marketplace/be/mcp-client-wrapper.js",
        "11",
        "http://localhost:3001"
      ],
      "env": {
        "MERCHANT_ID": "11",
        "MERCHANT_NAME": "TechMart",
        "MERCHANT_SLUG": "techmart",
        "BASE_URL": "http://localhost:3001"
      },
      "description": "TechMart - 3 APIs available",
      "disabled": false
    },
    "ai-marketplace-quickbite": {
      "command": "node",
      "args": [
        "/Users/himanshu.shekhar/Desktop/workspace/mcp-research/hackthon-rzp/ai_marketplace/be/mcp-client-wrapper.js",
        "12",
        "http://localhost:3001"
      ],
      "env": {
        "MERCHANT_ID": "12",
        "MERCHANT_NAME": "QuickBite",
        "MERCHANT_SLUG": "quickbite",
        "BASE_URL": "http://localhost:3001"
      },
      "description": "QuickBite - 3 APIs available",
      "disabled": false
    }
  }
}
```

#### Option B: Direct HTTP SSE

```json
{
  "mcpServers": {
    "ai-marketplace-fashionhub-http": {
      "url": "http://localhost:3001/api/mcp/merchants/10/stream",
      "transport": "sse",
      "description": "FashionHub via HTTP SSE",
      "disabled": false
    },
    "ai-marketplace-techmart-http": {
      "url": "http://localhost:3001/api/mcp/merchants/11/stream",
      "transport": "sse",
      "description": "TechMart via HTTP SSE",
      "disabled": false
    },
    "ai-marketplace-quickbite-http": {
      "url": "http://localhost:3001/api/mcp/merchants/12/stream",
      "transport": "sse",
      "description": "QuickBite via HTTP SSE",
      "disabled": false
    }
  }
}
```

### Step 4: Restart Cursor

After adding the configuration:
1. Save the settings file
2. Restart Cursor IDE
3. Open Cursor Chat (Cmd/Ctrl + L)

---

## ✅ Verify Setup

### Check MCP Servers

In Cursor Chat, you should see the MCP servers listed:
- 🏪 ai-marketplace-fashionhub
- 🏪 ai-marketplace-techmart
- 🏪 ai-marketplace-quickbite

### Test with Prompts

Try these prompts in Cursor Chat:

```
Show me all fashion products
```

```
What categories are available in TechMart?
```

```
List restaurants from QuickBite
```

Cursor will automatically use the appropriate MCP tools!

---

## 🎯 Available Tools Per Merchant

### FashionHub (4 tools)
- `get_products` - Get all fashion products with optional filters
- `get_product_by_id` - Get detailed information about a specific product
- `get_categories` - Get all available product categories
- `create_order` - Create a new order for products

### TechMart (3 tools)
- `search_electronics` - Search for electronic products
- `get_product_details` - Get detailed specs of an electronic product
- `add_to_cart` - Add product to shopping cart

### QuickBite (3 tools)
- `get_restaurants` - Get list of available restaurants
- `get_menu` - Get menu items for a restaurant
- `place_order` - Place a food order

---

## 🔧 Configuration Options

### Merging with Existing Config

If you already have MCP servers configured, merge the new ones:

```json
{
  "mcpServers": {
    "existing-server": {
      // ... your existing config
    },
    "ai-marketplace-fashionhub": {
      // ... new config
    }
  }
}
```

### Disabling a Server

Set `disabled: true` to temporarily disable:

```json
{
  "ai-marketplace-fashionhub": {
    // ... config
    "disabled": true
  }
}
```

### Custom Base URL

For production or different environment:

```bash
BASE_URL=https://your-domain.com node generate-cursor-config.js
```

---

## 📋 Pre-requisites

### 1. Backend Server Running

```bash
cd be
npm run dev
```

Server should be running on `http://localhost:3001`

### 2. Database Seeded

```bash
cd be
npm run db:seed
```

### 3. Node.js Available

Ensure Node.js is in your PATH:

```bash
which node
# Should output: /usr/local/bin/node or similar
```

---

## 🐛 Troubleshooting

### MCP Servers Not Appearing

**Check:**
1. Backend server is running: `curl http://localhost:3001/api/mcp/health`
2. MCP endpoints work: `curl http://localhost:3001/api/mcp/servers`
3. Cursor settings syntax is valid JSON
4. Cursor has been restarted after config change

### "Command not found" Error

**Fix:**
- Use absolute path to `node` command
- Find node path: `which node`
- Update config with full path:
  ```json
  {
    "command": "/usr/local/bin/node",
    "args": [...]
  }
  ```

### Tools Not Working

**Check:**
1. Merchant has APIs configured: `curl http://localhost:3001/api/mcp/merchants/10/tools`
2. Test tool execution: 
   ```bash
   curl -X POST http://localhost:3001/api/mcp/merchants/10/tools/get_categories \
     -H "Content-Type: application/json" \
     -d '{"args": {}}'
   ```
3. Check Cursor logs (Help > Toggle Developer Tools > Console)

### Connection Timeout

**Solutions:**
- Increase timeout in Cursor settings
- Check firewall/network settings
- Verify backend is accessible: `curl http://localhost:3001/health`

---

## 🔄 Updating Configuration

When you add new merchants or APIs:

1. Regenerate config:
   ```bash
   cd be
   node generate-cursor-config.js
   ```

2. Copy new config to Cursor settings

3. Restart Cursor

---

## 💡 Tips & Best Practices

### Use Specific Prompts

Instead of:
```
Get products
```

Use:
```
Show me electronics products from TechMart
```

### Reference Tools Explicitly

```
Use the get_categories tool from FashionHub to show me available categories
```

### Check Available Tools

Ask Cursor:
```
What tools are available for FashionHub?
```

### Multi-Merchant Queries

```
Compare product categories between FashionHub and TechMart
```

---

## 📊 Advanced Configuration

### Environment-Specific Config

Development:
```json
{
  "BASE_URL": "http://localhost:3001"
}
```

Production:
```json
{
  "BASE_URL": "https://api.example.com"
}
```

### Logging

Add logging to wrapper:
```json
{
  "env": {
    "DEBUG": "true",
    "LOG_LEVEL": "info"
  }
}
```

### Timeout Settings

```json
{
  "timeout": 30000
}
```

---

## 📚 Resources

- **MCP Specification**: https://modelcontextprotocol.io
- **Cursor MCP Docs**: https://docs.cursor.com/mcp
- **AI Marketplace Docs**: See `/docs` folder

---

## 🆘 Support

### Check Status

```bash
# Health check
curl http://localhost:3001/api/mcp/health

# List servers
curl http://localhost:3001/api/mcp/servers

# Test specific merchant
curl http://localhost:3001/api/mcp/merchants/10/info
```

### Debug Mode

```bash
# Run wrapper directly
node be/mcp-client-wrapper.js 10 http://localhost:3001
```

### Logs

Check Cursor logs:
1. Help > Toggle Developer Tools
2. Console tab
3. Look for MCP-related messages

---

## ✨ Example Conversations

### Fashion Shopping

```
You: Show me trending products from FashionHub
Cursor: [Uses get_products tool]
        Here are the trending fashion products...

You: What categories do you have?
Cursor: [Uses get_categories tool]
        We have: Clothing, Accessories, Footwear, Jewelry
```

### Electronics Search

```
You: I need a laptop for programming from TechMart
Cursor: [Uses search_electronics tool]
        Here are programming laptops available...
```

### Food Ordering

```
You: What restaurants are available in QuickBite?
Cursor: [Uses get_restaurants tool]
        Here are the available restaurants...
```

---

**Happy coding with AI Marketplace MCP! 🚀**

