# MCP Tool Customization - Implementation Plan

## Overview

Allow merchants to customize how their APIs appear as MCP tools to the AI, including:
- Custom tool names and descriptions
- Parameter descriptions with examples
- Usage guidelines
- Live preview of what AI sees

## Current Flow vs Proposed Flow

### Current Flow (Auto-Generated)

```
Merchant → API Configuration Form
  ├─ URL: https://api.example.com/search
  ├─ Method: POST
  ├─ Headers: [...]
  ├─ Body: {"message": "{{query}}"}
  └─ Save
      ↓
Database (apis table)
      ↓
MCP Service (Auto-generates)
  ├─ Tool Name: "search" (from API type)
  ├─ Description: "Execute search API" (generic)
  └─ Parameters:
      └─ query: "query parameter" (basic)
      ↓
AI Sees:
{
  "name": "search",
  "description": "Execute search API",
  "parameters": {
    "query": {"description": "query parameter"}
  }
}
```

**Problem**: Generic, not semantic, AI doesn't know when to use it.

### Proposed Flow (Merchant-Customized)

```
Merchant → Enhanced API Configuration Form
  ├─ URL: https://api.example.com/search
  ├─ Method: POST
  ├─ Headers: [...]
  ├─ Body: {"message": "{{query}}"}
  │
  ├─ 🆕 MCP Tool Configuration Section
  │   ├─ Tool Name: "search_products"
  │   ├─ Tool Description:
  │   │   "Search for beauty products in our catalog.
  │   │    Use this when customer wants to find, browse,
  │   │    or search for products. Pass their search query naturally."
  │   │
  │   ├─ Parameter Configurations:
  │   │   └─ query:
  │   │       ├─ Display Name: "Search Query"
  │   │       ├─ Description: "What the customer is looking for"
  │   │       ├─ Example: "lipstick", "hair oil", "moisturizer"
  │   │       └─ Required: true
  │   │
  │   └─ 👁️ Live Preview (what AI sees)
  │
  └─ Save
      ↓
Database (apis table)
  payload: {
    url: "...",
    method: "POST",
    body: {...},
    
    // 🆕 MCP Configuration
    toolName: "search_products",
    toolDescription: "Search for beauty products...",
    parameterConfigs: {
      query: {
        displayName: "Search Query",
        description: "What the customer is looking for",
        examples: ["lipstick", "hair oil"],
        required: true
      }
    }
  }
      ↓
MCP Service (Uses Custom Config)
      ↓
AI Sees:
{
  "name": "search_products",
  "description": "Search for beauty products in our catalog...",
  "parameters": {
    "query": {
      "type": "string",
      "description": "What the customer is looking for (e.g., 'lipstick', 'hair oil')"
    }
  }
}
```

**Benefits**: Semantic, clear, AI knows exactly when and how to use it!

## Implementation Plan

### Phase 1: Backend Schema Update

**File**: `be/prisma/schema.prisma` (Already flexible with JSON)

Current payload structure:
```json
{
  "url": "https://...",
  "method": "POST",
  "headers": [...],
  "params": [...],
  "body": {...}
}
```

Enhanced payload structure:
```json
{
  "url": "https://...",
  "method": "POST",
  "headers": [...],
  "params": [...],
  "body": {...},
  
  // NEW: MCP Tool Configuration
  "mcpConfig": {
    "toolName": "search_products",
    "toolDescription": "Search for products...",
    "usageHints": [
      "Use when customer wants to find products",
      "Pass natural language queries",
      "Extract keywords from customer message"
    ],
    "parameters": {
      "query": {
        "displayName": "Search Query",
        "description": "What the customer is looking for",
        "examples": ["lipstick", "hair oil", "moisturizer"],
        "type": "string",
        "required": true
      }
    }
  }
}
```

**No migration needed** - JSON fields are flexible!

### Phase 2: Update MCP Service

**File**: `be/src/services/mcpService.js`

#### Current:
```javascript
convertApiToTool(api) {
  const toolName = this.generateToolName(api.apiType);
  const description = this.generateToolDescription(api);
  const inputSchema = this.generateInputSchema(api.payload);
  
  return {
    name: toolName,
    description,
    inputSchema
  };
}
```

#### Enhanced:
```javascript
convertApiToTool(api) {
  const payload = api.payload;
  const mcpConfig = payload.mcpConfig || {};
  
  // Use custom config if provided, else auto-generate
  const toolName = mcpConfig.toolName 
    || payload.name 
    || this.generateToolName(api.apiType);
  
  const description = mcpConfig.toolDescription 
    || this.generateToolDescription(api);
  
  const inputSchema = this.generateInputSchemaWithConfig(
    payload,
    mcpConfig.parameters
  );
  
  return {
    name: toolName,
    description,
    inputSchema,
    metadata: {
      ...api.metadata,
      usageHints: mcpConfig.usageHints || []
    }
  };
}

generateInputSchemaWithConfig(payload, paramConfigs = {}) {
  const properties = {};
  const required = [];
  
  // Extract parameters from body/params
  const detectedParams = this.detectParameters(payload);
  
  // Enhance with custom configs
  detectedParams.forEach(param => {
    const config = paramConfigs[param.name] || {};
    
    properties[param.name] = {
      type: config.type || param.type || 'string',
      description: this.buildParamDescription(
        config.description,
        config.examples
      )
    };
    
    if (config.required !== false) {
      required.push(param.name);
    }
  });
  
  return {
    type: 'object',
    properties,
    required
  };
}

buildParamDescription(desc, examples) {
  let description = desc || 'Parameter value';
  
  if (examples && examples.length > 0) {
    description += ` (e.g., ${examples.map(e => `"${e}"`).join(', ')})`;
  }
  
  return description;
}
```

### Phase 3: Frontend UI Component

**File**: `fe/src/components/MCPToolConfigForm.jsx` (New Component)

```jsx
import React, { useState } from 'react';
import { Sparkles, Eye, Plus, X, Info } from 'lucide-react';

const MCPToolConfigForm = ({ apiConfig, onChange }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [mcpConfig, setMcpConfig] = useState(apiConfig.mcpConfig || {
    toolName: '',
    toolDescription: '',
    usageHints: [],
    parameters: {}
  });
  
  // Detect parameters from body
  const detectedParams = detectParametersFromBody(apiConfig.body);
  
  const updateMcpConfig = (updates) => {
    const updated = { ...mcpConfig, ...updates };
    setMcpConfig(updated);
    onChange(updated);
  };
  
  const addUsageHint = () => {
    const hints = [...(mcpConfig.usageHints || []), ''];
    updateMcpConfig({ usageHints: hints });
  };
  
  const updateUsageHint = (index, value) => {
    const hints = [...(mcpConfig.usageHints || [])];
    hints[index] = value;
    updateMcpConfig({ usageHints: hints });
  };
  
  const removeUsageHint = (index) => {
    const hints = (mcpConfig.usageHints || []).filter((_, i) => i !== index);
    updateMcpConfig({ usageHints: hints });
  };
  
  const updateParameter = (paramName, updates) => {
    const params = {
      ...mcpConfig.parameters,
      [paramName]: {
        ...(mcpConfig.parameters[paramName] || {}),
        ...updates
      }
    };
    updateMcpConfig({ parameters: params });
  };
  
  return (
    <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          MCP Tool Configuration
        </h3>
        <Info className="w-4 h-4 text-gray-400" title="Configure how this API appears to the AI" />
      </div>
      
      {/* Tool Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tool Name
          <span className="text-xs text-gray-500 ml-2">(How AI refers to this tool)</span>
        </label>
        <input
          type="text"
          value={mcpConfig.toolName || ''}
          onChange={(e) => updateMcpConfig({ toolName: e.target.value })}
          placeholder="e.g., search_products"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use snake_case, descriptive names (e.g., search_products, get_order_status)
        </p>
      </div>
      
      {/* Tool Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tool Description
          <span className="text-xs text-gray-500 ml-2">(When should AI use this?)</span>
        </label>
        <textarea
          value={mcpConfig.toolDescription || ''}
          onChange={(e) => updateMcpConfig({ toolDescription: e.target.value })}
          placeholder="Search for products in our catalog. Use this when customer wants to find, browse, or search for products."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Explain when AI should use this tool and what it does
        </p>
      </div>
      
      {/* Usage Hints */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Usage Hints (Optional)
        </label>
        {(mcpConfig.usageHints || []).map((hint, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={hint}
              onChange={(e) => updateUsageHint(index, e.target.value)}
              placeholder="e.g., Use when customer says 'show me' or 'find'"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => removeUsageHint(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addUsageHint}
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Hint
        </button>
      </div>
      
      {/* Parameters Configuration */}
      {detectedParams.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Parameter Descriptions
          </h4>
          
          {detectedParams.map((param) => (
            <div key={param.name} className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {param.name}
                </code>
                <span className="text-xs text-gray-500">
                  (detected from {param.source})
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={mcpConfig.parameters?.[param.name]?.displayName || ''}
                    onChange={(e) => updateParameter(param.name, { displayName: e.target.value })}
                    placeholder="e.g., Search Query"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Type
                  </label>
                  <select
                    value={mcpConfig.parameters?.[param.name]?.type || 'string'}
                    onChange={(e) => updateParameter(param.name, { type: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="array">Array</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description (What AI should pass here)
                </label>
                <input
                  type="text"
                  value={mcpConfig.parameters?.[param.name]?.description || ''}
                  onChange={(e) => updateParameter(param.name, { description: e.target.value })}
                  placeholder="e.g., What the customer is searching for"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Examples (comma-separated)
                </label>
                <input
                  type="text"
                  value={(mcpConfig.parameters?.[param.name]?.examples || []).join(', ')}
                  onChange={(e) => updateParameter(param.name, { 
                    examples: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="lipstick, hair oil, moisturizer"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id={`required-${param.name}`}
                  checked={mcpConfig.parameters?.[param.name]?.required !== false}
                  onChange={(e) => updateParameter(param.name, { required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor={`required-${param.name}`} className="text-xs text-gray-700">
                  Required parameter
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Preview Button */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mb-4"
      >
        <Eye className="w-4 h-4" />
        {showPreview ? 'Hide' : 'Show'} AI Preview
      </button>
      
      {/* Preview */}
      {showPreview && (
        <MCPToolPreview mcpConfig={mcpConfig} detectedParams={detectedParams} />
      )}
    </div>
  );
};

const MCPToolPreview = ({ mcpConfig, detectedParams }) => {
  const toolSchema = generateToolSchema(mcpConfig, detectedParams);
  
  return (
    <div className="p-4 bg-gray-900 rounded-lg text-white">
      <p className="text-xs text-gray-400 mb-2">What the AI sees:</p>
      <pre className="text-xs overflow-x-auto">
        {JSON.stringify(toolSchema, null, 2)}
      </pre>
    </div>
  );
};

// Helper functions
function detectParametersFromBody(body) {
  const params = [];
  
  if (body && typeof body === 'object') {
    Object.entries(body).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('{{')) {
        const match = value.match(/\{\{(\w+)\}\}/);
        if (match) {
          params.push({
            name: match[1],
            source: 'body',
            originalKey: key
          });
        }
      }
    });
  }
  
  return params;
}

function generateToolSchema(mcpConfig, detectedParams) {
  const properties = {};
  
  detectedParams.forEach(param => {
    const config = mcpConfig.parameters?.[param.name] || {};
    let description = config.description || `${param.name} parameter`;
    
    if (config.examples && config.examples.length > 0) {
      description += ` (e.g., ${config.examples.map(e => `"${e}"`).join(', ')})`;
    }
    
    properties[param.name] = {
      type: config.type || 'string',
      description
    };
  });
  
  return {
    name: mcpConfig.toolName || 'tool_name',
    description: mcpConfig.toolDescription || 'Tool description',
    parameters: {
      type: 'object',
      properties,
      required: detectedParams
        .filter(p => mcpConfig.parameters?.[p.name]?.required !== false)
        .map(p => p.name)
    }
  };
}

export default MCPToolConfigForm;
```

### Phase 4: Integrate into Dashboard

**File**: `fe/src/pages/MerchantDashboardComplete.jsx`

Add MCP Tool Configuration section in API configuration form:

```jsx
import MCPToolConfigForm from '../components/MCPToolConfigForm';

// In API configuration section:
<div className="mt-6">
  <MCPToolConfigForm
    apiConfig={currentApiConfig}
    onChange={(mcpConfig) => {
      setCurrentApiConfig({
        ...currentApiConfig,
        mcpConfig
      });
    }}
  />
</div>
```

### Phase 5: Update AI Service

**File**: `be/src/services/aiService.js`

Enhance system prompt to use usage hints:

```javascript
buildSystemPrompt(merchant, mcpTools) {
  const toolsDescription = mcpTools.map(tool => {
    let desc = `• ${tool.name}: ${tool.description}`;
    
    // Add usage hints if available
    if (tool.metadata?.usageHints?.length > 0) {
      desc += '\n  Usage Hints:';
      tool.metadata.usageHints.forEach(hint => {
        desc += `\n  - ${hint}`;
      });
    }
    
    // Add parameters
    const params = Object.entries(tool.inputSchema.properties || {})
      .map(([name, schema]) => `  - ${name}: ${schema.description}`)
      .join('\n');
    desc += `\n  Parameters:\n${params}`;
    
    return desc;
  }).join('\n\n');
  
  return `You are an AI shopping assistant for ${merchant.name}.

AVAILABLE TOOLS:
${toolsDescription}

...rest of system prompt...`;
}
```

## User Experience Flow

### Step 1: Merchant Configures API
```
Dashboard → API Configuration
  1. Enter basic API details (URL, method, headers)
  2. Define request body with placeholders
  3. Test API call
```

### Step 2: Configure MCP Tool
```
MCP Tool Configuration Section appears
  1. See detected parameters from body/query
  2. Fill in:
     - Tool Name: "search_products"
     - Description: "Search for products..."
     - Usage Hints: ["Use when customer says 'find'", ...]
  3. For each parameter:
     - Display Name: "Search Query"
     - Description: "What customer is looking for"
     - Examples: "lipstick, hair oil"
     - Required: ✓
```

### Step 3: Preview
```
Click "Show AI Preview"
  → See JSON schema of how AI will see the tool
  → Verify descriptions are clear
  → Test with sample queries
```

### Step 4: Save & Test
```
Save API Configuration
  → MCP tool created with custom config
  → Test in chat interface
  → Verify AI uses tool correctly
```

## Benefits

### For Merchants
✅ **Full Control**: Define exactly how AI should use their APIs
✅ **No Technical Knowledge**: Simple form, clear guidance
✅ **Live Preview**: See what AI sees before saving
✅ **Examples**: Guide AI with examples

### For AI
✅ **Clear Guidance**: Knows when and how to use tools
✅ **Better Context**: Understands parameter meanings
✅ **Examples**: Knows what format to use
✅ **Usage Hints**: Additional context for edge cases

### For Developers
✅ **Flexible**: JSON schema allows any configuration
✅ **Backward Compatible**: Auto-generation still works as fallback
✅ **Maintainable**: Merchants control their own tools
✅ **Scalable**: Works with any number of tools

## Example: Tira Beauty API

### Before (Auto-Generated)
```json
{
  "name": "search",
  "description": "Execute search API",
  "parameters": {
    "message": {
      "type": "string",
      "description": "message parameter"
    }
  }
}
```

### After (Merchant-Configured)
```json
{
  "name": "search_products",
  "description": "Search for beauty products in Tira's catalog. Use this when customer wants to find makeup, skincare, haircare, or fragrance products.",
  "usageHints": [
    "Use when customer says 'show me', 'find', 'search', or 'looking for'",
    "Extract product type and keywords from customer query",
    "Works best with specific product names or categories"
  ],
  "parameters": {
    "query": {
      "type": "string",
      "description": "What the customer is searching for - product type, brand, or specific item (e.g., 'red lipstick', 'Maybelline mascara', 'hair oil')"
    }
  }
}
```

**AI Performance**: 📈 Much better tool selection and usage!

## Migration Strategy

### Phase 1: Deploy Backend Changes
- Update mcpService to check for mcpConfig
- Fall back to auto-generation if not present
- Existing APIs continue working

### Phase 2: Deploy Frontend UI
- Add MCPToolConfigForm component
- Integrate into dashboard
- Merchants can start configuring

### Phase 3: Encourage Configuration
- Show notification for unconfigured tools
- Provide templates for common API types
- Analytics on tool usage improvement

## Future Enhancements

- [ ] AI-assisted description generation
- [ ] Template library for common APIs
- [ ] A/B testing different descriptions
- [ ] Analytics on tool call success rates
- [ ] Multi-language tool descriptions
- [ ] Voice-based API configuration

## Summary

This enhancement makes MCP tools:
- 🎯 **Merchant-Controlled**: Full customization of tool presentation
- 🧠 **AI-Friendly**: Clear, semantic descriptions
- 👁️ **Transparent**: Preview before saving
- ⚡ **Easy to Use**: Simple form interface
- 🚀 **Better Results**: AI uses tools more intelligently

Merchants become MCP tool architects! 🏗️

