const prisma = require('../lib/prisma');
const axios = require('axios');
const https = require('https');

class MCPService {
  /**
   * Get all APIs for a merchant and convert them to MCP tool definitions
   */
  async getMerchantTools(merchantId) {
    try {
      console.log(`\n=== Getting MCP Tools for Merchant ${merchantId} ===`);
      
      // Fetch merchant with their APIs and credentials
      const merchant = await prisma.merchant.findUnique({
        where: { id: parseInt(merchantId) },
        include: {
          apis: {
            include: {
              credential: true
            }
          }
        }
      });

      if (!merchant) {
        throw new Error('Merchant not found');
      }

      console.log(`Found merchant: ${merchant.name} (${merchant.slug})`);
      console.log(`Total APIs configured: ${merchant.apis.length}`);
      
      // Log each API
      merchant.apis.forEach((api, idx) => {
        console.log(`  API ${idx + 1}: type=${api.apiType}, name=${api.payload?.name}, url=${api.payload?.url}`);
      });

      // Convert APIs to MCP tools
      const tools = merchant.apis.map(api => this.convertApiToTool(api));

      console.log(`Converted to ${tools.length} tools`);

      return {
        merchant: {
          id: merchant.id,
          name: merchant.name,
          slug: merchant.slug
        },
        tools
      };
    } catch (error) {
      console.error('Error fetching merchant tools:', error);
      throw error;
    }
  }

  /**
   * Convert API configuration to MCP tool definition
   */
  convertApiToTool(api) {
    const config = api.config;
    const payload = api.payload;

    // Generate tool name from payload name or API type
    const toolName = payload.name || this.generateToolName(api.apiType, config);

    // Generate input schema from payload and config
    const inputSchema = this.generateInputSchema(payload, config);

    return {
      name: toolName,
      description: payload.description || config.description || `Execute ${api.apiType} API`,
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

    // Extract query parameters as inputs (from params array)
    if (payload.params && Array.isArray(payload.params)) {
      payload.params.forEach(param => {
        if (param.key && param.value) {
          // Check if value contains placeholder like {{search_query}}
          const placeholderMatch = param.value.match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const paramName = placeholderMatch[1];
            properties[paramName] = {
              type: 'string',
              description: `${param.key} parameter`
            };
            required.push(paramName);
          }
        }
      });
    }

    // If no dynamic params found, add a generic query parameter
    if (Object.keys(properties).length === 0) {
      properties['query'] = {
        type: 'string',
        description: 'Search query or input'
      };
    }

    return { properties, required };
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

