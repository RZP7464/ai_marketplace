const prisma = require('../lib/prisma');
const axios = require('axios');

class MCPService {
  /**
   * Get all APIs for a merchant and convert them to MCP tool definitions
   */
  async getMerchantTools(merchantId) {
    try {
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

      // Convert APIs to MCP tools
      const tools = merchant.apis.map(api => this.convertApiToTool(api));

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

    // Generate tool name from API type and config
    const toolName = this.generateToolName(api.apiType, config);

    // Generate input schema from payload
    const inputSchema = this.generateInputSchema(payload, config);

    return {
      name: toolName,
      description: config.description || `Execute ${api.apiType} API`,
      inputSchema: {
        type: 'object',
        properties: inputSchema.properties,
        required: inputSchema.required || []
      },
      metadata: {
        apiId: api.id,
        apiType: api.apiType,
        method: config.method || 'POST',
        endpoint: config.url || config.endpoint,
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

    // Extract parameters from payload
    if (payload && typeof payload === 'object') {
      Object.entries(payload).forEach(([key, value]) => {
        properties[key] = {
          type: this.inferType(value),
          description: config.parameters?.[key]?.description || `${key} parameter`
        };

        // Mark as required if specified in config
        if (config.parameters?.[key]?.required) {
          required.push(key);
        }
      });
    }

    // Add any additional parameters from config
    if (config.parameters) {
      Object.entries(config.parameters).forEach(([key, param]) => {
        if (!properties[key]) {
          properties[key] = {
            type: param.type || 'string',
            description: param.description || `${key} parameter`
          };

          if (param.required) {
            required.push(key);
          }
        }
      });
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
      // Find the API configuration
      const api = await prisma.api.findFirst({
        where: {
          merchantId: parseInt(merchantId),
          OR: [
            { apiType: toolName },
            { config: { path: ['toolName'], equals: toolName } }
          ]
        },
        include: {
          credential: true
        }
      });

      if (!api) {
        throw new Error(`Tool '${toolName}' not found for merchant`);
      }

      // Prepare API request
      const requestConfig = await this.prepareApiRequest(api, args);

      // Execute API call
      const response = await axios(requestConfig);

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error executing tool:', error);
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
    const credential = api.credential;

    // Build request config
    const requestConfig = {
      method: config.method || 'POST',
      url: config.url || config.endpoint,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
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

