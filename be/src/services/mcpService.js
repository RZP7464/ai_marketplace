const prisma = require('../lib/prisma');
const axios = require('axios');
const https = require('https');
const apiParserService = require('./apiParserService');

class MCPService {
  /**
   * Get all APIs for a merchant and convert them to MCP tool definitions
   * 
   * CRITICAL: This method ONLY returns tools for APIs that are:
   * 1. Configured in the database (apis table)
   * 2. Have valid credentials (credential must exist)
   * 3. Belong to the specified merchant
   * 
   * If a merchant hasn't configured an API, it will NOT appear as a tool!
   */
  async getMerchantTools(merchantId) {
    try {
      console.log(`\n=== Getting MCP Tools for Merchant ${merchantId} ===`);
      
      // Fetch merchant with their APIs and credentials
      // ONLY includes APIs configured in database for THIS merchant
      const merchant = await prisma.merchant.findUnique({
        where: { id: parseInt(merchantId) },
        include: {
          apis: {
            where: {
              // Additional filter: ensure API has valid configuration
              payload: { not: null },
              config: { not: null }
            },
            include: {
              credential: true
            }
          }
        }
      });

      if (!merchant) {
        throw new Error('Merchant not found');
      }

      console.log(`✅ Found merchant: ${merchant.name} (${merchant.slug})`);
      console.log(`📦 APIs configured in database: ${merchant.apis.length}`);
      
      if (merchant.apis.length === 0) {
        console.log(`⚠️  No APIs configured for merchant ${merchant.name}. No tools will be available.`);
        return {
          merchant: {
            id: merchant.id,
            name: merchant.name,
            slug: merchant.slug
          },
          tools: []
        };
      }
      
      // Log each API configuration found in database
      merchant.apis.forEach((api, idx) => {
        console.log(`  ✓ API ${idx + 1}: type=${api.apiType}, name=${api.payload?.name}, hasCredential=${!!api.credential}`);
      });

      // Convert ONLY the configured APIs to MCP tools
      const tools = merchant.apis.map(api => this.convertApiToTool(api));

      console.log(`🔧 Converted ${tools.length} configured APIs to MCP tools`);
      console.log(`   Tools available: ${tools.map(t => t.name).join(', ')}`);

      return {
        merchant: {
          id: merchant.id,
          name: merchant.name,
          slug: merchant.slug
        },
        tools
      };
    } catch (error) {
      console.error('❌ Error fetching merchant tools:', error);
      throw error;
    }
  }

  /**
   * Convert API configuration to MCP tool definition
   * Enhanced to support custom MCP configurations from merchants
   */
  convertApiToTool(api) {
    const config = api.config;
    const payload = api.payload;
    const mcpConfig = payload.mcpConfig;

    // Check if merchant provided custom MCP configuration
    if (mcpConfig && mcpConfig.toolName) {
      console.log(`  ✨ Using custom MCP config for tool: ${mcpConfig.toolName}`);
      return this.convertApiToToolWithConfig(api, mcpConfig);
    }

    // Fallback to auto-generation (backward compatible)
    console.log(`  🔄 Auto-generating tool config for: ${api.apiType}`);
    
    // Generate tool name from payload name or API type
    const toolName = payload.name || this.generateToolName(api.apiType, config);

    // Generate input schema from payload and config
    const inputSchema = this.generateInputSchema(payload, config);

    // Generate intelligent description
    const description = this.generateToolDescription(api, payload, inputSchema);

    return {
      name: toolName,
      description,
      inputSchema: {
        type: 'object',
        properties: inputSchema.properties,
        required: inputSchema.required || []
      },
      metadata: {
        apiId: api.id,
        apiType: api.apiType,
        method: payload.method || config.method || 'POST',
        endpoint: payload.url || config.url || config.endpoint,
        authId: api.authId
      }
    };
  }

  /**
   * Convert API to tool using merchant's custom MCP configuration
   */
  convertApiToToolWithConfig(api, mcpConfig) {
    const config = api.config;
    const payload = api.payload;

    // Use custom tool name
    const toolName = mcpConfig.toolName;

    // Build input schema from custom parameter configs
    const inputSchema = this.generateInputSchemaWithConfig(payload, mcpConfig.parameters || {});

    // Use custom description
    const description = mcpConfig.toolDescription || this.generateToolDescription(api, payload, inputSchema);

    return {
      name: toolName,
      description,
      inputSchema: {
        type: 'object',
        properties: inputSchema.properties,
        required: inputSchema.required || []
      },
      metadata: {
        apiId: api.id,
        apiType: api.apiType,
        method: payload.method || config.method || 'POST',
        endpoint: payload.url || config.url || config.endpoint,
        authId: api.authId,
        usageHints: mcpConfig.usageHints || [] // Store usage hints for AI
      }
    };
  }

  /**
   * Generate input schema with custom parameter configurations
   */
  generateInputSchemaWithConfig(payload, paramConfigs) {
    const properties = {};
    const required = [];

    // Detect parameters from payload (body and query params)
    const detectedParams = this.detectParameters(payload);

    // Build schema using custom configs or defaults
    detectedParams.forEach(param => {
      const config = paramConfigs[param.name] || {};
      
      // Build parameter description with examples
      const description = this.buildParamDescription(
        config.description || this.generateParamDescription(param.name, param.originalKey),
        config.examples || []
      );

      properties[param.name] = {
        type: config.type || 'string',
        description
      };

      // Check if parameter is required (default true unless explicitly set to false)
      if (config.required !== false) {
        required.push(param.name);
      }
    });

    // If no parameters detected, add a generic query parameter
    if (Object.keys(properties).length === 0) {
      properties['query'] = {
        type: 'string',
        description: 'User\'s search query, question, or request'
      };
      required.push('query');
    }

    return { properties, required };
  }

  /**
   * Detect parameters from payload body and query params
   */
  detectParameters(payload) {
    const params = [];
    const seen = new Set();

    // Extract from body template
    if (payload.body && typeof payload.body === 'object') {
      Object.entries(payload.body).forEach(([key, value]) => {
        if (typeof value === 'string' && value.includes('{{')) {
          const placeholderMatch = value.match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const paramName = placeholderMatch[1];
            if (!seen.has(paramName)) {
              params.push({
                name: paramName,
                source: 'body',
                originalKey: key
              });
              seen.add(paramName);
            }
          }
        }
      });
    }

    // Extract from query parameters
    if (payload.params && Array.isArray(payload.params)) {
      payload.params.forEach(param => {
        if (param.key && param.value) {
          const placeholderMatch = param.value.match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const paramName = placeholderMatch[1];
            if (!seen.has(paramName)) {
              params.push({
                name: paramName,
                source: 'query',
                originalKey: param.key
              });
              seen.add(paramName);
            }
          }
        }
      });
    }

    return params;
  }

  /**
   * Build parameter description with examples
   */
  buildParamDescription(description, examples) {
    if (!examples || examples.length === 0) {
      return description;
    }

    // Add examples to description
    const exampleText = examples.map(ex => `"${ex}"`).join(', ');
    return `${description} (e.g., ${exampleText})`;
  }

  /**
   * Generate intelligent tool description
   */
  generateToolDescription(api, payload, inputSchema) {
    // If custom description provided, use it
    if (payload.description) {
      return payload.description;
    }

    // Generate smart description based on API type and parameters
    const apiType = api.apiType.toLowerCase();
    const params = Object.keys(inputSchema.properties);
    const mainParam = params[0];

    // Common patterns
    if (apiType.includes('search') || mainParam?.includes('query') || mainParam?.includes('search')) {
      return `Search for products or items. Use this when the user wants to find, search, or browse products. Pass the user's search query naturally.`;
    }

    if (apiType.includes('product')) {
      return `Get product information. Use when user asks about specific products or wants product details.`;
    }

    if (apiType.includes('cart')) {
      return `Add items to shopping cart. Use when user wants to buy or add products to cart.`;
    }

    if (apiType.includes('checkout')) {
      return `Proceed to checkout. Use when user is ready to purchase items in their cart.`;
    }

    if (apiType.includes('order')) {
      return `Manage orders. Use to check order status, history, or details.`;
    }

    // Fallback with parameter hints
    const paramHint = mainParam ? `Takes "${mainParam}" parameter from user query` : '';
    return `${api.apiType} functionality. ${paramHint}`.trim();
  }

  /**
   * Generate tool name from API type and config
   */
  generateToolName(apiType, config) {
    // Use custom name if provided, otherwise generate from API type
    if (config.toolName) {
      return config.toolName;
    }

    // Clean and format API type as tool name
    return apiType
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Generate JSON Schema for tool inputs from payload configuration
   */
  generateInputSchema(payload, config) {
    const properties = {};
    const required = [];

    // Only extract actual input parameters, not internal config
    // Skip internal fields like url, method, headers, params, body, name, description
    const internalFields = ['url', 'method', 'headers', 'params', 'body', 'name', 'description'];

    // Extract from body template if it exists
    if (payload.body && typeof payload.body === 'object') {
      Object.entries(payload.body).forEach(([key, value]) => {
        if (typeof value === 'string' && value.includes('{{')) {
          // Extract placeholder: {{query}} or {{search_term}}
          const placeholderMatch = value.match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const paramName = placeholderMatch[1];
            properties[paramName] = {
              type: 'string',
              description: this.generateParamDescription(paramName, key)
            };
            required.push(paramName);
          }
        } else if (!internalFields.includes(key)) {
          // Direct parameter (no placeholder)
          properties[key] = {
            type: this.inferType(value),
            description: this.generateParamDescription(key, key)
          };
        }
      });
    }

    // Extract query parameters as inputs (from params array)
    if (payload.params && Array.isArray(payload.params)) {
      payload.params.forEach(param => {
        if (param.key && param.value) {
          // Check if value contains placeholder like {{search_query}}
          const placeholderMatch = param.value.match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const paramName = placeholderMatch[1];
            if (!properties[paramName]) {
              properties[paramName] = {
                type: 'string',
                description: this.generateParamDescription(paramName, param.key)
              };
              required.push(paramName);
            }
          }
        }
      });
    }

    // If no dynamic params found, add a generic query parameter
    if (Object.keys(properties).length === 0) {
      properties['query'] = {
        type: 'string',
        description: 'User\'s search query, question, or request (pass the user message naturally)'
      };
      required.push('query');
    }

    return { properties, required };
  }

  /**
   * Generate intelligent parameter description
   */
  generateParamDescription(paramName, originalKey) {
    const name = paramName.toLowerCase();

    if (name.includes('query') || name.includes('search') || name.includes('q')) {
      return 'What the user is searching for or asking about (e.g., "lipstick", "hair oil", etc.)';
    }

    if (name.includes('message') || name.includes('msg')) {
      return 'User\'s message or query (pass their request naturally)';
    }

    if (name.includes('term') || name.includes('keyword')) {
      return 'Search term or keyword from user query';
    }

    if (name.includes('id')) {
      return 'Unique identifier';
    }

    if (name.includes('name')) {
      return 'Name or title';
    }

    if (name.includes('category')) {
      return 'Product category or type';
    }

    if (name.includes('price')) {
      return 'Price value or range';
    }

    // Fallback: use the parameter name with better formatting
    return `${originalKey || paramName} value from user query`;
  }

  /**
   * Infer JSON Schema type from value
   */
  inferType(value) {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'string';
    const type = typeof value;
    if (type === 'object') return 'object';
    return type;
  }

  /**
   * Execute a tool (API call)
   */
  async executeTool(merchantId, toolName, args) {
    try {
      console.log(`\n=== Executing Tool: ${toolName} ===`);
      console.log('Merchant ID:', merchantId);
      console.log('Args:', args);
      
      // Find the API configuration by tool name in payload
      const api = await prisma.api.findFirst({
        where: {
          merchantId: parseInt(merchantId),
          payload: { path: ['name'], equals: toolName }
        },
        include: {
          credential: true
        }
      });

      if (!api) {
        console.log(`Tool '${toolName}' not found. Checking all APIs for merchant...`);
        const allApis = await prisma.api.findMany({
          where: { merchantId: parseInt(merchantId) }
        });
        console.log('Available APIs:', allApis.map(a => ({ apiType: a.apiType, payloadName: a.payload?.name })));
        throw new Error(`Tool '${toolName}' not found for merchant`);
      }

      console.log('Found API config:', {
        apiType: api.apiType,
        url: api.payload?.url,
        method: api.payload?.method
      });

      // Prepare API request
      const requestConfig = await this.prepareApiRequest(api, args);
      console.log('Request config:', {
        method: requestConfig.method,
        url: requestConfig.url,
        params: requestConfig.params,
        dataKeys: requestConfig.data ? Object.keys(requestConfig.data) : null
      });

      // Execute API call
      const response = await axios(requestConfig);
      console.log('API Response status:', response.status);
      console.log('API Response data sample:', JSON.stringify(response.data).substring(0, 500));

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error executing tool:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Prepare axios request configuration from API config and args
   */
  async prepareApiRequest(api, args) {
    const config = api.config;
    const payload = api.payload;
    const credential = api.credential;

    // Build request config
    const requestConfig = {
      method: payload.method || config.method || 'POST',
      url: payload.url || config.url || config.endpoint,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      // For development: ignore SSL certificate errors
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
    };

    // Add authentication
    if (credential) {
      this.addAuthentication(requestConfig, credential, args);
    }

    // Add request body
    if (['POST', 'PUT', 'PATCH'].includes(requestConfig.method.toUpperCase())) {
      requestConfig.data = this.buildRequestBody(api.payload, args, config);
    }

    // Add query parameters for GET requests
    if (requestConfig.method.toUpperCase() === 'GET') {
      requestConfig.params = args;
    }

    return requestConfig;
  }

  /**
   * Add authentication to request
   */
  addAuthentication(requestConfig, credential, args) {
    switch (credential.authType) {
      case 'bearer':
        requestConfig.headers['Authorization'] = `Bearer ${args.token || credential.header}`;
        break;
      
      case 'api_key':
        if (credential.header) {
          const [headerName, headerValue] = credential.header.split(':');
          requestConfig.headers[headerName.trim()] = headerValue.trim();
        }
        break;
      
      case 'basic':
        if (credential.username && credential.password) {
          const token = Buffer.from(`${credential.username}:${credential.password}`).toString('base64');
          requestConfig.headers['Authorization'] = `Basic ${token}`;
        }
        break;
      
      case 'custom':
        if (credential.header) {
          try {
            const customHeaders = JSON.parse(credential.header);
            Object.assign(requestConfig.headers, customHeaders);
          } catch (e) {
            console.error('Error parsing custom headers:', e);
          }
        }
        break;
    }
  }

  /**
   * Build request body from payload template and arguments
   */
  buildRequestBody(payload, args, config) {
    if (!payload) return args;

    // Deep clone payload
    const body = JSON.parse(JSON.stringify(payload));

    // Replace placeholders with actual values
    return this.replacePlaceholders(body, args);
  }

  /**
   * Recursively replace placeholders in object
   */
  replacePlaceholders(obj, args) {
    if (typeof obj === 'string') {
      // Replace {{placeholder}} with actual value
      return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return args[key] !== undefined ? args[key] : match;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.replacePlaceholders(item, args));
    }

    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replacePlaceholders(value, args);
      }
      return result;
    }

    return obj;
  }
}

module.exports = new MCPService();

