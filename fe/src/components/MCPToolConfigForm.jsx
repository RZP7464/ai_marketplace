import React, { useState, useEffect } from 'react';
import { Sparkles, Eye, Plus, X, Info, ChevronDown, ChevronUp } from 'lucide-react';

const MCPToolConfigForm = ({ apiConfig, onChange, defaultToolName = '', defaultDescription = '', compact = false }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact); // Start collapsed in compact mode
  const [mcpConfig, setMcpConfig] = useState({
    toolName: '',
    toolDescription: '',
    usageHints: [],
    parameters: {}
  });

  // Initialize MCP config from apiConfig
  useEffect(() => {
    if (apiConfig?.mcpConfig) {
      setMcpConfig(apiConfig.mcpConfig);
    } else {
      // Set defaults based on API type or provided defaults
      const toolName = defaultToolName || generateDefaultToolName(apiConfig);
      const toolDescription = defaultDescription || '';
      setMcpConfig(prev => ({
        ...prev,
        toolName,
        toolDescription
      }));
    }
  }, [apiConfig, defaultToolName, defaultDescription]);

  // Detect parameters from body
  const detectedParams = detectParametersFromBody(apiConfig);

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
        ...(mcpConfig.parameters?.[paramName] || {}),
        ...updates
      }
    };
    updateMcpConfig({ parameters: params });
  };

  // Show empty state if no body configured yet (skip for compact mode - always show form)
  if (!compact && !apiConfig?.body && !apiConfig?.params) {
    return (
      <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            MCP Tool Configuration
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🤖✨📝</div>
          <h4 className="text-xl font-semibold text-gray-800 mb-2">
            Make Your API AI-Friendly!
          </h4>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Add descriptions and hints to help AI understand when and how to use your API.
          </p>
          <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-700">
            <p className="flex items-center gap-2">
              <span className="text-green-500">✓</span> AI uses your API more accurately
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Better customer conversations
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Clear parameter guidance for AI
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Live preview before saving
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Configure your API request body first to enable MCP tool configuration
          </p>
        </div>
      </div>
    );
  }

  // Compact mode styling for 2FA section
  const containerClass = compact 
    ? "mt-3 p-3 bg-[#1e1e3f]/50 rounded-lg border border-purple-500/30"
    : "mt-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200";
  
  const headerClass = compact
    ? "text-sm font-medium text-purple-300"
    : "text-lg font-semibold text-gray-800";

  return (
    <div className={containerClass}>
      {/* Header with collapse toggle */}
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={compact ? "w-4 h-4 text-purple-400" : "w-5 h-5 text-purple-600"} />
          <h3 className={headerClass}>
            {compact ? "AI Tool Config" : "MCP Tool Configuration"}
          </h3>
          {!compact && (
            <div className="relative group">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                Configure how this API appears to the AI assistant. Add descriptions, hints, and examples to help AI use your API intelligently.
              </div>
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className={compact ? "w-4 h-4 text-purple-400" : "w-5 h-5 text-gray-600"} />
        ) : (
          <ChevronDown className={compact ? "w-4 h-4 text-purple-400" : "w-5 h-5 text-gray-600"} />
        )}
      </div>

      {isExpanded && (
        <div className={compact ? "space-y-3" : "space-y-4"}>
          {/* Tool Name */}
          <div>
            <label className={compact 
              ? "block text-xs font-medium text-gray-400 mb-1" 
              : "block text-sm font-medium text-gray-700 mb-2"
            }>
              Tool Name *
              {!compact && (
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (How AI refers to this tool)
                </span>
              )}
            </label>
            <input
              type="text"
              value={mcpConfig.toolName || ''}
              onChange={(e) => updateMcpConfig({ toolName: e.target.value })}
              placeholder="e.g., search_products"
              className={compact
                ? "w-full px-2 py-1.5 bg-[#1e1e3f] border border-gray-700 rounded text-white placeholder-gray-500 text-xs focus:ring-1 focus:ring-purple-500"
                : "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              }
            />
            {!compact && (
              <p className="text-xs text-gray-500 mt-1">
                Use snake_case, descriptive names (e.g., search_products, get_order_status)
              </p>
            )}
          </div>

          {/* Tool Description */}
          <div>
            <label className={compact 
              ? "block text-xs font-medium text-gray-400 mb-1" 
              : "block text-sm font-medium text-gray-700 mb-2"
            }>
              Tool Description *
              {!compact && (
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (When should AI use this?)
                </span>
              )}
            </label>
            <textarea
              value={mcpConfig.toolDescription || ''}
              onChange={(e) => updateMcpConfig({ toolDescription: e.target.value })}
              placeholder="Describe when AI should use this tool..."
              rows={compact ? 2 : 3}
              className={compact
                ? "w-full px-2 py-1.5 bg-[#1e1e3f] border border-gray-700 rounded text-white placeholder-gray-500 text-xs focus:ring-1 focus:ring-purple-500 resize-none"
                : "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              }
            />
            {!compact && (
              <p className="text-xs text-gray-500 mt-1">
                Explain when AI should use this tool and what it does
              </p>
            )}
          </div>

          {/* Usage Hints - Hidden in compact mode */}
          {!compact && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Hints (Optional)
                <span className="text-xs text-gray-500 font-normal ml-2">
                  Help AI understand when to use this tool
                </span>
              </label>
              {(mcpConfig.usageHints || []).map((hint, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => updateUsageHint(index, e.target.value)}
                    placeholder="e.g., Use when customer says 'show me' or 'find'"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeUsageHint(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove hint"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addUsageHint}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-1"
              >
                <Plus className="w-4 h-4" /> Add Hint
              </button>
            </div>
          )}

          {/* Parameters Configuration - Hidden in compact mode */}
          {!compact && detectedParams.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Parameter Descriptions
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (Detected from {"{{placeholders}}"})
                </span>
              </h4>

              {detectedParams.map((param) => (
                <div
                  key={param.name}
                  className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <code className="text-sm font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {param.name}
                    </code>
                    <span className="text-xs text-gray-500">
                      (detected from {param.source}.{param.originalKey})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={mcpConfig.parameters?.[param.name]?.displayName || ''}
                        onChange={(e) => updateParameter(param.name, { displayName: e.target.value })}
                        placeholder="e.g., Search Query"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type
                      </label>
                      <select
                        value={mcpConfig.parameters?.[param.name]?.type || 'string'}
                        onChange={(e) => updateParameter(param.name, { type: e.target.value })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Description (What AI should pass here)
                    </label>
                    <input
                      type="text"
                      value={mcpConfig.parameters?.[param.name]?.description || ''}
                      onChange={(e) => updateParameter(param.name, { description: e.target.value })}
                      placeholder="e.g., What the customer is searching for"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mt-3">
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
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mt-3 flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${param.name}`}
                      checked={mcpConfig.parameters?.[param.name]?.required !== false}
                      onChange={(e) => updateParameter(param.name, { required: e.target.checked })}
                      className="mr-2 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor={`required-${param.name}`} className="text-xs text-gray-700 cursor-pointer">
                      Required parameter
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview Button - Hidden in compact mode */}
          {!compact && (
            <>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Hide' : 'Show'} AI Preview
              </button>

              {/* Preview */}
              {showPreview && (
                <MCPToolPreview mcpConfig={mcpConfig} detectedParams={detectedParams} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Preview Component
const MCPToolPreview = ({ mcpConfig, detectedParams }) => {
  const toolSchema = generateToolSchema(mcpConfig, detectedParams);

  return (
    <div className="p-4 bg-gray-900 rounded-lg text-white">
      <p className="text-xs text-gray-400 mb-2">What the AI sees:</p>
      <pre className="text-xs overflow-x-auto font-mono">
        {JSON.stringify(toolSchema, null, 2)}
      </pre>
    </div>
  );
};

// Helper Functions
function detectParametersFromBody(apiConfig) {
  const params = [];
  const seen = new Set();

  if (!apiConfig) return params;

  // Extract from body
  if (apiConfig.body && typeof apiConfig.body === 'object') {
    Object.entries(apiConfig.body).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('{{')) {
        const match = value.match(/\{\{(\w+)\}\}/);
        if (match && !seen.has(match[1])) {
          params.push({
            name: match[1],
            source: 'body',
            originalKey: key
          });
          seen.add(match[1]);
        }
      }
    });
  }

  // Extract from query params
  if (apiConfig.params && Array.isArray(apiConfig.params)) {
    apiConfig.params.forEach(param => {
      if (param.key && param.value && typeof param.value === 'string') {
        const match = param.value.match(/\{\{(\w+)\}\}/);
        if (match && !seen.has(match[1])) {
          params.push({
            name: match[1],
            source: 'query',
            originalKey: param.key
          });
          seen.add(match[1]);
        }
      }
    });
  }

  return params;
}

function generateToolSchema(mcpConfig, detectedParams) {
  const properties = {};
  const required = [];

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

    if (config.required !== false) {
      required.push(param.name);
    }
  });

  return {
    name: mcpConfig.toolName || 'tool_name',
    description: mcpConfig.toolDescription || 'Tool description',
    usageHints: mcpConfig.usageHints || [],
    parameters: {
      type: 'object',
      properties,
      required
    }
  };
}

function generateDefaultToolName(apiConfig) {
  if (!apiConfig || !apiConfig.apiType) return '';
  
  // Clean and format API type as tool name
  return apiConfig.apiType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default MCPToolConfigForm;

