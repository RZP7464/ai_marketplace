# MCP Tool Customization - Implementation Checklist

## Phase 1: Backend Changes ⚙️

### 1.1 Update MCP Service
**File**: `be/src/services/mcpService.js`

- [ ] Add `convertApiToToolWithConfig()` method
  - Check for `api.payload.mcpConfig`
  - Use custom config if present
  - Fall back to auto-generation if not
  
- [ ] Add `generateInputSchemaWithConfig()` method
  - Read parameter configs from `mcpConfig.parameters`
  - Build JSON schema properties
  - Add examples to descriptions
  
- [ ] Add `buildParamDescription()` helper
  - Combine description + examples
  - Format: "Description (e.g., 'example1', 'example2')"

**Estimated Time**: 1-2 hours

---

### 1.2 Update AI Service
**File**: `be/src/services/aiService.js`

- [ ] Enhance `buildSystemPrompt()` method
  - Include usage hints for each tool
  - Format tool descriptions with hints
  - Make it more conversational

**Estimated Time**: 30 minutes

---

### 1.3 Add Parse API Endpoint (Already Done! ✅)
**File**: `be/src/routes/merchant.js`

- [x] POST `/api/merchant/parse-api` endpoint
- [x] Uses `apiParserService`

---

## Phase 2: Frontend Components 🎨

### 2.1 Create MCPToolConfigForm Component
**File**: `fe/src/components/MCPToolConfigForm.jsx` (NEW)

- [ ] Create new component file
- [ ] Add tool name input
- [ ] Add tool description textarea
- [ ] Add usage hints array input
  - Add/remove hint buttons
  - Multiple hints support
- [ ] Detect parameters from body/query
- [ ] For each parameter:
  - Display name input
  - Type selector (string/number/boolean/array)
  - Description input
  - Examples input (comma-separated)
  - Required checkbox
- [ ] Add "Show AI Preview" button
- [ ] Style with Tailwind (purple/blue gradient theme)

**Estimated Time**: 3-4 hours

---

### 2.2 Create MCPToolPreview Component
**File**: `fe/src/components/MCPToolConfigForm.jsx` (in same file)

- [ ] Create preview component
- [ ] Generate JSON schema from mcpConfig
- [ ] Display in code block (dark theme)
- [ ] Real-time updates as merchant types

**Estimated Time**: 1 hour

---

### 2.3 Add Helper Functions
**File**: `fe/src/components/MCPToolConfigForm.jsx`

- [ ] `detectParametersFromBody(body)`
  - Find `{{placeholder}}` patterns
  - Extract parameter names
  - Return array with metadata
  
- [ ] `generateToolSchema(mcpConfig, detectedParams)`
  - Build preview JSON schema
  - Combine descriptions + examples
  - Calculate required fields

**Estimated Time**: 1 hour

---

## Phase 3: Dashboard Integration 🏗️

### 3.1 Update Merchant Dashboard
**File**: `fe/src/pages/MerchantDashboardComplete.jsx`

- [ ] Import `MCPToolConfigForm`
- [ ] Add section after API configuration form
- [ ] Add collapsible/expandable section
- [ ] Pass `currentApiConfig` as prop
- [ ] Handle `onChange` callback
- [ ] Update state with `mcpConfig`
- [ ] Include `mcpConfig` in save payload

**Estimated Time**: 1-2 hours

---

### 3.2 Update API Save Handler
**File**: `fe/src/pages/MerchantDashboardComplete.jsx`

- [ ] Ensure `mcpConfig` is included in payload
- [ ] Validate required fields (optional)
- [ ] Show success message mentioning MCP config

**Estimated Time**: 30 minutes

---

## Phase 4: Testing & Validation 🧪

### 4.1 Backend Testing
- [ ] Test with mcpConfig present
- [ ] Test with mcpConfig absent (fallback)
- [ ] Test parameter detection
- [ ] Test schema generation
- [ ] Verify system prompt includes hints

**Estimated Time**: 1 hour

---

### 4.2 Frontend Testing
- [ ] Test form inputs (all fields)
- [ ] Test parameter detection
- [ ] Test preview generation
- [ ] Test save with mcpConfig
- [ ] Test responsive design

**Estimated Time**: 1 hour

---

### 4.3 Integration Testing
- [ ] Create API with MCP config
- [ ] Verify tool appears correctly in chat
- [ ] Test AI tool selection
- [ ] Verify AI uses tool correctly
- [ ] Compare before/after AI performance

**Estimated Time**: 2 hours

---

## Phase 5: Documentation & Polish 📚

### 5.1 User Documentation
- [ ] Add tooltip help text
- [ ] Create video/GIF tutorial
- [ ] Add examples for common APIs
- [ ] Update merchant guide

**Estimated Time**: 1-2 hours

---

### 5.2 Developer Documentation
- [x] Implementation plan (this doc!)
- [x] Flow diagrams
- [ ] Code comments
- [ ] API documentation update

**Estimated Time**: 1 hour

---

## Quick Start Implementation Order

For fastest results, implement in this order:

### Step 1 (Core Backend - 2 hours)
1. Update `mcpService.js` - tool generation with config
2. Update `aiService.js` - system prompt with hints

### Step 2 (Core Frontend - 4 hours)
3. Create `MCPToolConfigForm.jsx` component
4. Create preview component
5. Add helper functions

### Step 3 (Integration - 2 hours)
6. Integrate into `MerchantDashboardComplete.jsx`
7. Update save handler

### Step 4 (Testing - 2 hours)
8. Test end-to-end flow
9. Fix any issues

### Step 5 (Polish - 2 hours)
10. Add documentation
11. Add examples/tooltips

**Total Estimated Time**: 12-14 hours

---

## Key Files to Modify

### Backend (3 files)
1. `be/src/services/mcpService.js` - Tool generation logic
2. `be/src/services/aiService.js` - System prompt enhancement
3. `be/src/routes/merchant.js` - Already done! ✅

### Frontend (2 files)
1. `fe/src/components/MCPToolConfigForm.jsx` - NEW component
2. `fe/src/pages/MerchantDashboardComplete.jsx` - Integration

---

## Expected Payload Structure

### Before (Current)
```json
{
  "apiType": "search",
  "payload": {
    "url": "https://api.tira.com/search",
    "method": "POST",
    "body": {"message": "{{query}}"}
  }
}
```

### After (Enhanced)
```json
{
  "apiType": "search",
  "payload": {
    "url": "https://api.tira.com/search",
    "method": "POST",
    "body": {"message": "{{query}}"},
    
    "mcpConfig": {
      "toolName": "search_products",
      "toolDescription": "Search for beauty products in Tira catalog...",
      "usageHints": [
        "Use when customer says 'find' or 'show me'",
        "Extract product keywords from query"
      ],
      "parameters": {
        "query": {
          "displayName": "Search Query",
          "description": "What the customer is searching for",
          "examples": ["lipstick", "hair oil", "moisturizer"],
          "type": "string",
          "required": true
        }
      }
    }
  }
}
```

---

## Success Metrics

After implementation, you should see:

✅ **Merchant Experience**
- Clear form to configure tools
- Live preview of what AI sees
- Easy to add examples and hints

✅ **AI Performance**
- Better tool selection (measure % correct)
- Fewer hallucinations
- More natural conversations

✅ **Developer Experience**
- Clean, maintainable code
- Backward compatible
- Well documented

✅ **System Reliability**
- No breaking changes
- Fallback to auto-generation works
- All existing APIs continue working

---

## Optional Enhancements (Future)

- [ ] AI-assisted description generation
- [ ] Template library for common API types
- [ ] Import/export tool configs
- [ ] A/B testing different descriptions
- [ ] Analytics dashboard for tool usage
- [ ] Multi-language support
- [ ] Voice input for configuration

---

## Dependencies

### Backend
- Prisma (already installed)
- Existing API parser service (already exists)

### Frontend
- React (already installed)
- Tailwind CSS (already installed)
- Lucide icons (already installed)

**No new dependencies needed!** 🎉

---

## Risk Mitigation

### What could go wrong?
1. **Breaking existing APIs**: Mitigated by fallback to auto-generation
2. **Complex UI**: Keep form simple, progressive disclosure
3. **Performance**: JSON parsing is fast, no issues expected
4. **Adoption**: Provide templates and examples to encourage use

---

## Next Steps

Ready to implement? Start with:

1. **Backend first**: Update `mcpService.js` and `aiService.js`
2. **Test backend**: Verify tool generation works
3. **Frontend component**: Create `MCPToolConfigForm.jsx`
4. **Integrate**: Add to dashboard
5. **Test end-to-end**: Create sample API with config
6. **Polish**: Add docs and examples

Let's build this! 🚀

