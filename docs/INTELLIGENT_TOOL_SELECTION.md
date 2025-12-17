# Intelligent Tool Selection

## Problem Solved

Previously, the AI wasn't reliably selecting the right tools based on user queries:
- ❌ User says "find lipstick" → AI doesn't use search tool
- ❌ User says "show me products" → AI responds without calling API
- ❌ Tools available but AI doesn't know when to use them
- ❌ Vague tool descriptions lead to poor selection

## Solution

**AI-guided tool selection** with:
1. System prompt that teaches the AI when and how to use tools
2. Semantic tool descriptions that explain each tool's purpose
3. Intelligent parameter descriptions
4. Examples and usage patterns

## How It Works

### 1. System Prompt (AI Guidance)

Before processing user messages, the AI receives a comprehensive system prompt:

```
You are an AI shopping assistant for {Merchant Name}.

AVAILABLE TOOLS:
• search_products: Search for products. Use when user wants to find/browse items
  Parameters:
  - query: What the user is searching for (e.g., "lipstick", "hair oil")

TOOL USAGE GUIDELINES:
1. When to use tools:
   - User asks to search/find/show products → Use search tool
   - User mentions specific needs → Use search with relevant query

2. How to call tools:
   - Extract user's search intent
   - Pass natural language queries
   - Examples:
     * "Show me lipstick" → search_products(query: "lipstick")
     * "I need hair oil" → search_products(query: "hair oil")

3. Important:
   - ALWAYS use tools when user is searching
   - Don't make up products - use tool results
   - Extract keywords from queries
```

### 2. Smart Tool Descriptions

Tools get intelligent descriptions based on their purpose:

**Before:**
```json
{
  "name": "search",
  "description": "Execute search API"
}
```

**After:**
```json
{
  "name": "search_products",
  "description": "Search for products or items. Use this when the user wants to find, search, or browse products. Pass the user's search query naturally."
}
```

### 3. Enhanced Parameter Descriptions

Parameters include clear guidance on what to pass:

**Before:**
```json
{
  "query": {
    "type": "string",
    "description": "query parameter"
  }
}
```

**After:**
```json
{
  "query": {
    "type": "string",
    "description": "What the user is searching for or asking about (e.g., 'lipstick', 'hair oil', etc.)"
  }
}
```

## Implementation

### Backend Services

#### 1. System Prompt Builder (`aiService.js`)

```javascript
buildSystemPrompt(merchant, mcpTools) {
  // Creates detailed guidance
  // Lists all tools with descriptions
  // Provides usage examples
  // Explains when to call tools
}
```

**Integrated into:**
- Gemini chat (added to history)
- OpenAI chat (added as system message)

#### 2. Tool Description Generator (`mcpService.js`)

```javascript
generateToolDescription(api, payload, inputSchema) {
  // Analyzes API type
  // Checks parameter names
  // Generates semantic description
  // Includes usage hints
}
```

**Patterns Recognized:**
- Search APIs → "Search for products. Use when user wants to find..."
- Product APIs → "Get product information. Use when..."
- Cart APIs → "Add items to cart. Use when..."
- Checkout APIs → "Proceed to checkout. Use when..."

#### 3. Parameter Description Generator

```javascript
generateParamDescription(paramName, originalKey) {
  // Recognizes query/search params
  // Adds usage examples
  // Explains what to pass
  // Provides context
}
```

**Recognized Patterns:**
- `query`, `search`, `q` → "What the user is searching for..."
- `message`, `msg` → "User's message or query..."
- `term`, `keyword` → "Search term from user query"

## Tool Selection Flow

```
User: "show me lipstick"
    ↓
AI receives system prompt (guidance on tools)
    ↓
AI sees available tools:
  • search_products: "Search for products. Use when user wants to find..."
    - query: "What user is searching for (e.g., 'lipstick')"
    ↓
AI recognizes intent: User wants to search
    ↓
AI selects tool: search_products
    ↓
AI extracts parameter: query = "lipstick"
    ↓
Tool executed with correct params
    ↓
Results returned and displayed
```

## Examples

### Example 1: Product Search

**User Message:**
```
"I'm looking for hair oil"
```

**AI Processing:**
1. Sees "looking for" → search intent
2. Recognizes "hair oil" → search term
3. Selects `search_products` tool
4. Calls: `search_products(query: "hair oil")`
5. Gets results and presents them

### Example 2: Show Request

**User Message:**
```
"Show me moisturizers"
```

**AI Processing:**
1. Sees "show me" → search intent
2. Extracts "moisturizers" → product type
3. Calls: `search_products(query: "moisturizers")`
4. Displays products from results

### Example 3: Natural Query

**User Message:**
```
"What lipsticks do you have?"
```

**AI Processing:**
1. Question about products → search needed
2. Identifies "lipsticks" → category
3. Calls: `search_products(query: "lipsticks")`
4. Formats results as answer

### Example 4: Specific Need

**User Message:**
```
"I need something for dry skin"
```

**AI Processing:**
1. Expresses need → search for solutions
2. Extracts "dry skin" → condition/category
3. Calls: `search_products(query: "dry skin")`
4. Recommends products from results

## Testing Tool Selection

### Test 1: Direct Search
```
User: "search for lipstick"
Expected: Calls search_products(query: "lipstick")
```

### Test 2: Implicit Search
```
User: "show me hair products"
Expected: Calls search_products(query: "hair products")
```

### Test 3: Question Format
```
User: "do you have mascara?"
Expected: Calls search_products(query: "mascara")
```

### Test 4: Need Expression
```
User: "I'm looking for foundation"
Expected: Calls search_products(query: "foundation")
```

### Test 5: Browse Intent
```
User: "what products do you have?"
Expected: Calls search_products(query: "products")
```

## Configuration

### System Prompt

Automatically generated per merchant. Includes:
- Merchant name and context
- Available tools list
- Usage guidelines
- Examples
- Parameter formats

### Tool Descriptions

Auto-generated based on:
- API type (search, product, cart, etc.)
- Parameter names
- Payload structure
- Common patterns

### No Manual Configuration Required

The system intelligently:
- Analyzes API configurations
- Generates appropriate descriptions
- Provides usage guidance
- Updates dynamically

## Benefits

### For AI
- ✅ Clear guidance on when to use tools
- ✅ Understands tool purposes
- ✅ Knows what parameters to pass
- ✅ Has usage examples

### For Users
- ✅ Natural language queries work
- ✅ No need to use specific formats
- ✅ AI understands intent
- ✅ Gets relevant results

### For Developers
- ✅ No manual tool mapping
- ✅ Automatic description generation
- ✅ Works with any API
- ✅ Intelligent parameter extraction

## Debugging

### Check Tool Descriptions

View what AI sees:
```bash
GET /api/mcp/:merchantId/tools

Response:
{
  "tools": [
    {
      "name": "search_products",
      "description": "Search for products...",
      "inputSchema": {
        "properties": {
          "query": {
            "type": "string",
            "description": "What user is searching for..."
          }
        }
      }
    }
  ]
}
```

### Check System Prompt

Add logging in `aiService.js`:
```javascript
console.log('System Prompt:', systemPrompt);
```

### Check Tool Calls

Backend logs show:
```
=== Executing Tool: search_products ===
Merchant ID: 1
Args: { query: "lipstick" }
```

### Tool Not Being Called?

**Possible Issues:**
1. Tool description too vague
2. Parameter description unclear
3. System prompt not sent
4. AI provider issues

**Solutions:**
1. Check tool description clarity
2. Verify parameter names match intent
3. Ensure system prompt includes examples
4. Try different temperature settings

## Advanced Features

### Context-Aware Selection

AI considers:
- Conversation history
- Previous tool calls
- User's current need
- Available options

### Multi-Tool Scenarios

Can call multiple tools:
```
User: "Show me lipsticks and their prices"
→ Calls search_products(query: "lipsticks")
→ Uses results to provide prices
```

### Parameter Extraction

Intelligent extraction from queries:
- "red lipstick" → query: "red lipstick"
- "lipstick under 500" → query: "lipstick", filters price
- "matte finish lip color" → query: "matte lipstick"

## Future Enhancements

- [ ] Learning from successful tool calls
- [ ] A/B testing descriptions
- [ ] Per-merchant prompt customization
- [ ] Tool call analytics
- [ ] Auto-improve descriptions based on usage

## Troubleshooting

### AI Not Using Tools?

1. **Check system prompt is sent**
   - Verify in logs
   - Ensure prompt generation works

2. **Verify tool descriptions**
   - Should explain WHEN to use
   - Should include examples
   - Should be action-oriented

3. **Check parameter descriptions**
   - Should explain WHAT to pass
   - Should include format/examples
   - Should be clear and specific

4. **Test with explicit queries**
   - Try: "search for X"
   - Should definitely trigger tool

5. **Check AI provider settings**
   - Temperature not too high
   - Tool calling enabled
   - Model supports function calling

### Wrong Tool Selected?

1. **Review tool descriptions**
   - May be too similar
   - Need more distinction
   - Add usage hints

2. **Check parameter matching**
   - Ensure names are semantic
   - Descriptions should be clear
   - Examples help differentiation

3. **Update system prompt**
   - Add more specific guidance
   - Include edge cases
   - Provide counter-examples

## Summary

The intelligent tool selection system:
- 🤖 **Guides AI** on when and how to use tools
- 📝 **Semantic descriptions** explain tool purposes
- 🎯 **Smart parameter extraction** from queries
- ✨ **Works automatically** with any API
- 🚀 **Improves continuously** based on patterns

Your AI now intelligently selects the right tools for user queries! 🎉

