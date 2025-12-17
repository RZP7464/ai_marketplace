const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Intelligent API Parser Service
 * 
 * Uses AI to parse API configurations (curl, OpenAPI, etc.) and generate:
 * 1. Semantic parameter names (user-friendly, not HTTP-specific)
 * 2. Clean tool descriptions
 * 3. Intelligent parameter mapping
 * 
 * Instead of exposing raw query params/body, creates clean semantic parameters
 * that the AI can understand and generate naturally.
 */
class APIParserService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  /**
   * Parse curl command into structured API configuration
   */
  parseCurlCommand(curlCommand) {
    const config = {
      method: 'GET',
      url: '',
      headers: [],
      body: null,
      queryParams: []
    };

    // Extract method
    const methodMatch = curlCommand.match(/-X\s+(\w+)/i);
    if (methodMatch) {
      config.method = methodMatch[1].toUpperCase();
    } else if (curlCommand.includes('--data')) {
      config.method = 'POST';
    }

    // Extract URL
    const urlMatch = curlCommand.match(/curl\s+'([^']+)'/i) || curlCommand.match(/curl\s+"([^"]+)"/i) || curlCommand.match(/curl\s+(\S+)/i);
    if (urlMatch) {
      const fullUrl = urlMatch[1];
      const urlObj = new URL(fullUrl);
      config.url = urlObj.origin + urlObj.pathname;
      
      // Extract query parameters
      urlObj.searchParams.forEach((value, key) => {
        config.queryParams.push({ key, value });
      });
    }

    // Extract headers
    const headerRegex = /-H\s+'([^:]+):\s*([^']+)'/g;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(curlCommand)) !== null) {
      const key = headerMatch[1].trim();
      const value = headerMatch[2].trim();
      
      // Skip browser-specific headers
      if (!this.isBrowserHeader(key)) {
        config.headers.push({ key, value });
      }
    }

    // Extract body data
    const dataMatch = curlCommand.match(/--data-raw\s+'([^']+)'/i) || 
                      curlCommand.match(/--data\s+'([^']+)'/i) ||
                      curlCommand.match(/-d\s+'([^']+)'/i);
    if (dataMatch) {
      try {
        config.body = JSON.parse(dataMatch[1]);
      } catch (e) {
        config.body = dataMatch[1];
      }
    }

    return config;
  }

  /**
   * Check if header is browser-specific and should be excluded
   */
  isBrowserHeader(headerName) {
    const browserHeaders = [
      'accept-language',
      'cache-control',
      'pragma',
      'sec-fetch',
      'user-agent',
      'sec-ch-ua',
      'referer',
      'origin'
    ];
    return browserHeaders.some(h => headerName.toLowerCase().includes(h));
  }

  /**
   * Use AI to generate semantic tool configuration from API config
   * This creates clean, user-friendly parameter names instead of raw HTTP details
   */
  async generateSemanticToolConfig(apiConfig, apiType) {
    if (!this.genAI) {
      // Fallback to basic parsing if no AI available
      return this.generateBasicToolConfig(apiConfig, apiType);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Analyze this API configuration and generate a clean, semantic MCP tool specification.

API Type: ${apiType}
URL: ${apiConfig.url}
Method: ${apiConfig.method}
Body: ${JSON.stringify(apiConfig.body, null, 2)}
Query Params: ${JSON.stringify(apiConfig.queryParams, null, 2)}

Requirements:
1. Create semantic parameter names (e.g., "search_query" not "q" or "message")
2. Generate a clear tool description
3. Identify which parameters are required vs optional
4. Suggest appropriate data types
5. Map semantic parameters to actual API fields

Return ONLY valid JSON in this exact format:
{
  "toolName": "search_products",
  "description": "Search for products using natural language query",
  "parameters": [
    {
      "name": "search_query",
      "type": "string",
      "description": "What to search for",
      "required": true,
      "mapsTo": {
        "location": "body",
        "field": "message"
      }
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = response.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const toolConfig = JSON.parse(jsonText);
      return toolConfig;
    } catch (error) {
      console.error('AI parsing error:', error);
      return this.generateBasicToolConfig(apiConfig, apiType);
    }
  }

  /**
   * Fallback: Generate basic tool config without AI
   */
  generateBasicToolConfig(apiConfig, apiType) {
    const parameters = [];

    // Extract parameters from body
    if (apiConfig.body && typeof apiConfig.body === 'object') {
      Object.keys(apiConfig.body).forEach(key => {
        parameters.push({
          name: key,
          type: this.inferType(apiConfig.body[key]),
          description: `${key} parameter`,
          required: true,
          mapsTo: {
            location: 'body',
            field: key
          }
        });
      });
    }

    // Extract parameters from query params
    apiConfig.queryParams.forEach(param => {
      // Check if it's a placeholder
      if (param.value.includes('{{') || param.value.includes('${')) {
        const paramName = param.value.match(/\{\{(\w+)\}\}/) || param.value.match(/\$\{(\w+)\}/);
        parameters.push({
          name: paramName ? paramName[1] : param.key,
          type: 'string',
          description: `${param.key} parameter`,
          required: true,
          mapsTo: {
            location: 'query',
            field: param.key
          }
        });
      }
    });

    return {
      toolName: apiType.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
      description: `${apiType} API`,
      parameters
    };
  }

  /**
   * Infer data type from value
   */
  inferType(value) {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  /**
   * Generate enhanced API payload with semantic tool configuration
   */
  async generateEnhancedPayload(curlOrConfig, apiType) {
    // Parse curl command if it's a string
    const apiConfig = typeof curlOrConfig === 'string' 
      ? this.parseCurlCommand(curlOrConfig)
      : curlOrConfig;

    // Generate semantic tool configuration using AI
    const toolConfig = await this.generateSemanticToolConfig(apiConfig, apiType);

    // Create enhanced payload
    const enhancedPayload = {
      // Original API details (for execution)
      url: apiConfig.url,
      method: apiConfig.method,
      headers: apiConfig.headers.filter(h => h.key && h.value),
      
      // Semantic tool configuration (for MCP)
      name: toolConfig.toolName,
      description: toolConfig.description,
      
      // Clean parameter mapping
      parameterMapping: toolConfig.parameters.map(param => ({
        semanticName: param.name,
        type: param.type,
        description: param.description,
        required: param.required,
        httpMapping: param.mapsTo
      })),
      
      // Template for dynamic replacement
      bodyTemplate: apiConfig.body,
      queryTemplate: apiConfig.queryParams
    };

    return enhancedPayload;
  }

  /**
   * Map semantic parameters to actual HTTP request
   * When executing a tool, this converts clean semantic params to actual API call
   */
  mapSemanticToHttp(semanticParams, payload) {
    const httpRequest = {
      url: payload.url,
      method: payload.method,
      headers: {}
    };

    // Copy headers
    payload.headers.forEach(h => {
      httpRequest.headers[h.key] = h.value;
    });

    // Build body from semantic parameters
    if (payload.bodyTemplate) {
      httpRequest.body = {};
      
      payload.parameterMapping.forEach(mapping => {
        if (mapping.httpMapping.location === 'body') {
          const semanticValue = semanticParams[mapping.semanticName];
          if (semanticValue !== undefined) {
            httpRequest.body[mapping.httpMapping.field] = semanticValue;
          }
        }
      });
    }

    // Build query parameters from semantic parameters
    const queryParams = [];
    payload.parameterMapping.forEach(mapping => {
      if (mapping.httpMapping.location === 'query') {
        const semanticValue = semanticParams[mapping.semanticName];
        if (semanticValue !== undefined) {
          queryParams.push(`${mapping.httpMapping.field}=${encodeURIComponent(semanticValue)}`);
        }
      }
    });

    if (queryParams.length > 0) {
      httpRequest.url += (httpRequest.url.includes('?') ? '&' : '?') + queryParams.join('&');
    }

    return httpRequest;
  }

  /**
   * Generate MCP tool schema from enhanced payload
   * Creates the JSON Schema for tool parameters
   */
  generateToolSchema(payload) {
    const properties = {};
    const required = [];

    payload.parameterMapping.forEach(param => {
      properties[param.semanticName] = {
        type: param.type,
        description: param.description
      };
      
      if (param.required) {
        required.push(param.semanticName);
      }
    });

    return {
      type: 'object',
      properties,
      required
    };
  }
}

module.exports = new APIParserService();

