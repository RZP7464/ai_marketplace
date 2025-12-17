# MCP Tool Customization - Testing Guide

## Quick Test Checklist

### ✅ Test 1: Form Appears Correctly

1. Navigate to: `http://localhost:3000/onboarding` or Settings
2. Go to API Configuration section
3. Select any API (e.g., "Search Items")
4. Fill in URL, Method, Headers
5. Add a body with placeholders:
```json
{
  "message": "{{query}}"
}
```

**Expected Result:**
- ✅ MCP Tool Configuration section appears below body
- ✅ Form is expandable/collapsible
- ✅ Empty state shows if no body yet

### ✅ Test 2: Parameter Detection

**Setup:** Body with multiple parameters
```json
{
  "message": "{{query}}",
  "category": "{{category}}",
  "limit": 10
}
```

**Expected Result:**
- ✅ Form detects "query" parameter
- ✅ Form detects "category" parameter
- ✅ Shows source (body.message, body.category)
- ✅ Each parameter has its own config section

### ✅ Test 3: Fill MCP Configuration

**Fill the form:**
```
Tool Name: search_products
Tool Description: Search for beauty products in our catalog. Use when customer wants to find, browse, or search for products.

Usage Hints:
  [Use when customer says 'show me' or 'find']
  [Extract product keywords from customer message]
  [Works best with specific product names]

Parameter: query
  Display Name: Search Query
  Type: String
  Description: What the customer is searching for
  Examples: lipstick, hair oil, moisturizer, face wash
  ☑️ Required
```

**Expected Result:**
- ✅ All fields accept input
- ✅ Can add/remove usage hints
- ✅ Examples can be comma-separated
- ✅ Checkbox works

### ✅ Test 4: Live Preview

1. Click "Show AI Preview"

**Expected Result:**
```json
{
  "name": "search_products",
  "description": "Search for beauty products in our catalog...",
  "usageHints": [
    "Use when customer says 'show me' or 'find'",
    "Extract product keywords from customer message",
    "Works best with specific product names"
  ],
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "What the customer is searching for (e.g., 'lipstick', 'hair oil', 'moisturizer', 'face wash')"
      }
    },
    "required": ["query"]
  }
}
```
- ✅ JSON is valid
- ✅ Examples appear in description
- ✅ Usage hints included
- ✅ Can hide preview

### ✅ Test 5: Save Configuration

1. Click "Complete Setup" or "Save"

**Expected Result:**
- ✅ No errors
- ✅ Success message appears
- ✅ Redirects to dashboard

### ✅ Test 6: Verify Database

**Check the database:**
```bash
# In backend terminal
node
> const { PrismaClient } = require('@prisma/client')
> const prisma = new PrismaClient()
> prisma.api.findFirst({ where: { apiType: 'search_item' }, include: { merchant: true } }).then(console.log)
```

**Expected Result:**
```json
{
  "payload": {
    "url": "...",
    "method": "POST",
    "body": {"message": "{{query}}"},
    "mcpConfig": {  ← Should be present!
      "toolName": "search_products",
      "toolDescription": "...",
      "usageHints": [...],
      "parameters": {
        "query": {
          "displayName": "Search Query",
          "description": "...",
          "examples": ["lipstick", "hair oil", "moisturizer"],
          "type": "string",
          "required": true
        }
      }
    }
  }
}
```

### ✅ Test 7: MCP Service Reads Config

**Test the MCP service:**
```bash
# In backend, add a console.log in mcpService.js convertApiToTool
# Or check terminal logs when starting backend
```

**Expected Result in Logs:**
```
✨ Using custom MCP config for tool: search_products
```

**If no config:**
```
🔄 Auto-generating tool config for: search_item
```

### ✅ Test 8: AI System Prompt

**Check AI prompt:**
Look in backend logs when a chat message is sent, or add a console.log in `aiService.js`:

```javascript
buildSystemPrompt(merchant, mcpTools) {
  const prompt = // ... existing code
  console.log('=== SYSTEM PROMPT ===')
  console.log(prompt)
  return prompt
}
```

**Expected Result:**
```
AVAILABLE TOOLS:
• search_products: Search for beauty products in our catalog...
  Usage Hints:
    - Use when customer says 'show me' or 'find'
    - Extract product keywords from customer message
    - Works best with specific product names
  Parameters:
    - query (string): What the customer is searching for (e.g., 'lipstick', 'hair oil', 'moisturizer')
```

### ✅ Test 9: AI Chat - Tool Selection

**Navigate to:** `http://localhost:3000/chat/tira` (or your merchant slug)

**Test Messages:**
```
1. "Show me lipstick"
2. "I need hair oil"
3. "Find moisturizers"
4. "Looking for face wash"
```

**Expected Result:**
- ✅ AI recognizes search intent
- ✅ AI calls search_products tool
- ✅ AI passes correct query ("lipstick", "hair oil", etc.)
- ✅ Results are displayed
- ✅ AI responds naturally

**Check Backend Logs:**
```
=== Executing Tool: search_products ===
Merchant ID: 1
Args: { query: 'lipstick' }
```

### ✅ Test 10: Backward Compatibility

**Test an old API without mcpConfig:**

1. Manually remove mcpConfig from an API in the database
2. Restart backend
3. Test chat

**Expected Result:**
- ✅ No errors
- ✅ Auto-generation kicks in
- ✅ Tool still works (with generic description)
- ✅ Log shows: `🔄 Auto-generating tool config`

## 🐛 Troubleshooting

### Form doesn't appear
- **Check:** Is the body filled in?
- **Check:** Is the API type supported?
- **Fix:** Fill in body first, then form appears

### Parameters not detected
- **Check:** Are placeholders in format `{{paramName}}`?
- **Check:** Is body valid JSON?
- **Fix:** Use correct placeholder format

### Preview shows wrong data
- **Check:** Did you save after editing?
- **Check:** Is JSON parseable?
- **Fix:** Click away from input to trigger onChange

### Config not saved
- **Check:** Browser console for errors
- **Check:** Backend logs
- **Fix:** Check network tab, ensure API call succeeds

### AI doesn't use tool
- **Check:** Is tool description clear?
- **Check:** Are usage hints helpful?
- **Check:** Is system prompt being used?
- **Fix:** Make description more explicit about when to use

### Tool calls with wrong parameters
- **Check:** Parameter descriptions
- **Check:** Examples provided
- **Fix:** Make parameter description clearer

## 📊 Success Criteria

After testing, all of these should be ✅:

### Merchant Experience
- [ ] Form is easy to understand
- [ ] Parameter detection works automatically
- [ ] Can add/edit/remove usage hints
- [ ] Live preview is accurate
- [ ] Save works without errors
- [ ] Can edit existing configs

### AI Performance
- [ ] AI selects correct tool for queries
- [ ] AI passes correct parameters
- [ ] AI understands when to use tool (usage hints work)
- [ ] Fewer incorrect tool calls
- [ ] More natural responses

### Technical
- [ ] No console errors
- [ ] No linter errors
- [ ] Backward compatible (old APIs work)
- [ ] Database saves correctly
- [ ] Backend reads config properly
- [ ] System prompt includes hints

## 🎯 Test Scenarios

### Scenario 1: Beauty Product Search (Tira)
```
Setup:
  Tool Name: search_products
  Description: Search for beauty products
  Hint: "Use when customer says 'show me', 'find', or 'search'"
  
Test:
  User: "Show me red lipstick"
  
Expected:
  ✅ AI uses search_products
  ✅ Passes query="red lipstick"
  ✅ Shows product results
```

### Scenario 2: Order Status (Generic)
```
Setup:
  Tool Name: get_order_status
  Description: Check order status and tracking
  Hint: "Use when customer asks about their order"
  Parameter: order_id - "Customer's order number"
  
Test:
  User: "Where is my order #12345?"
  
Expected:
  ✅ AI uses get_order_status
  ✅ Extracts order_id="12345"
  ✅ Shows order details
```

### Scenario 3: Multiple Tools
```
Setup:
  Tool 1: search_products
  Tool 2: add_to_cart
  
Test:
  User: "Show me lipstick"
  → AI uses search_products ✅
  
  User: "Add the first one to cart"
  → AI uses add_to_cart ✅
```

## 🔍 Verification Commands

### Check if backend is running
```bash
curl http://localhost:3001/health
```

### Check if frontend is running
```bash
curl http://localhost:3000
```

### Check merchant tools
```bash
curl http://localhost:3001/api/merchant/tools/tira
```

### Test chat
```bash
curl -X POST http://localhost:3001/api/chat/public/tira \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me lipstick"}'
```

## 📝 Test Report Template

```markdown
# MCP Tool Customization Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** Development

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Form Appears | ✅/❌ | |
| Parameter Detection | ✅/❌ | |
| Fill Configuration | ✅/❌ | |
| Live Preview | ✅/❌ | |
| Save Configuration | ✅/❌ | |
| Database Verification | ✅/❌ | |
| MCP Service Reads | ✅/❌ | |
| System Prompt | ✅/❌ | |
| AI Tool Selection | ✅/❌ | |
| Backward Compatibility | ✅/❌ | |

## Issues Found

1. [Issue description]
   - **Severity:** High/Medium/Low
   - **Steps to reproduce:**
   - **Expected:**
   - **Actual:**

## Recommendations

- [Recommendation 1]
- [Recommendation 2]

## Conclusion

Overall Status: ✅ Pass / ❌ Fail / ⚠️ Pass with issues

**Summary:** [Brief summary of test results]
```

## 🎓 Pro Tips

1. **Test with real data**: Use actual product names, not "test" values
2. **Test edge cases**: Long descriptions, special characters, empty hints
3. **Test on mobile**: Ensure form is responsive
4. **Test multiple merchants**: Verify isolation
5. **Monitor logs**: Keep backend/frontend terminals visible
6. **Use browser DevTools**: Check network tab for API calls
7. **Test incrementally**: Test each feature before moving to next

## 🚀 Ready to Test!

Start with Test 1 and work your way through. Mark each ✅ as you complete them.

**Good luck! 🎉**

