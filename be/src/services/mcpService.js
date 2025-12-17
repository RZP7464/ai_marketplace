const prisma = require("../lib/prisma");
const axios = require("axios");
const https = require("https");
const apiParserService = require("./apiParserService");

class MCPService {
  /**
   * Get all APIs for a merchant and convert them to MCP tool definitions
   *
   * CRITICAL: This method ONLY returns tools for APIs that are:
   * 1. Configured in the database (apis table)
   * 2. Have valid credentials (credential must exist)
   * 3. Belong to the specified merchant
   * 4. Have a valid URL configured (not empty)
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
              config: { not: null },
            },
            include: {
              credential: true,
            },
          },
        },
      });

      if (!merchant) {
        throw new Error("Merchant not found");
      }

      console.log(`✅ Found merchant: ${merchant.name} (${merchant.slug})`);
      console.log(`📦 APIs in database: ${merchant.apis.length}`);

      // Filter out APIs that don't have a valid URL configured
      const validApis = merchant.apis.filter((api) => {
        const url = api.payload?.url || api.config?.url || api.config?.endpoint;
        const hasValidUrl = url && url.trim() !== "";

        if (!hasValidUrl) {
          console.log(`  ⚠️ Skipping API ${api.apiType}: No URL configured`);
        }
        return hasValidUrl;
      });

      console.log(`📦 APIs with valid URLs: ${validApis.length}`);

      if (validApis.length === 0) {
        console.log(
          `⚠️  No valid APIs configured for merchant ${merchant.name}. No tools will be available.`
        );
        return {
          merchant: {
            id: merchant.id,
            name: merchant.name,
            slug: merchant.slug,
          },
          tools: [],
        };
      }

      // Log each valid API configuration
      validApis.forEach((api, idx) => {
        const toolName =
          api.payload?.mcpConfig?.toolName || api.payload?.name || api.apiType;
        console.log(
          `  ✓ API ${idx + 1}: type=${
            api.apiType
          }, toolName=${toolName}, hasCredential=${!!api.credential}`
        );
      });

      // Convert ONLY the valid APIs to MCP tools
      const tools = validApis.map((api) => this.convertApiToTool(api));

      console.log(`🔧 Converted ${tools.length} valid APIs to MCP tools`);
      console.log(`   Tools available: ${tools.map((t) => t.name).join(", ")}`);

      return {
        merchant: {
          id: merchant.id,
          name: merchant.name,
          slug: merchant.slug,
        },
        tools,
      };
    } catch (error) {
      console.error("❌ Error fetching merchant tools:", error);
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
      console.log(
        `  ✨ Using custom MCP config for tool: ${mcpConfig.toolName}`
      );
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
        type: "object",
        properties: inputSchema.properties,
        required: inputSchema.required || [],
      },
      metadata: {
        apiId: api.id,
        apiType: api.apiType,
        method: payload.method || config.method || "POST",
        endpoint: payload.url || config.url || config.endpoint,
        authId: api.authId,
      },
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
    const inputSchema = this.generateInputSchemaWithConfig(
      payload,
      mcpConfig.parameters || {}
    );

    // Use custom description
    const description =
      mcpConfig.toolDescription ||
      this.generateToolDescription(api, payload, inputSchema);

    return {
      name: toolName,
      description,
      inputSchema: {
        type: "object",
        properties: inputSchema.properties,
        required: inputSchema.required || [],
      },
      metadata: {
        apiId: api.id,
        apiType: api.apiType,
        method: payload.method || config.method || "POST",
        endpoint: payload.url || config.url || config.endpoint,
        authId: api.authId,
        usageHints: mcpConfig.usageHints || [], // Store usage hints for AI
      },
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
    detectedParams.forEach((param) => {
      const config = paramConfigs[param.name] || {};

      // Build parameter description with examples
      const description = this.buildParamDescription(
        config.description ||
          this.generateParamDescription(param.name, param.originalKey),
        config.examples || []
      );

      properties[param.name] = {
        type: config.type || "string",
        description,
      };

      // Check if parameter is required (default true unless explicitly set to false)
      if (config.required !== false) {
        required.push(param.name);
      }
    });

    // If no parameters detected, add default parameters based on API type
    if (Object.keys(properties).length === 0) {
      // Get API type from payload to determine appropriate default params
      const apiType = payload.mcpConfig?.toolName || payload.name || "";

      // Tool-specific default parameters
      if (apiType.includes("send_otp") || apiType === "send_otp") {
        properties["phone_number"] = {
          type: "string",
          description: "User's phone number to send OTP to (e.g., 9876543210)",
        };
        required.push("phone_number");
      } else if (apiType.includes("verify_otp") || apiType === "verify_otp") {
        properties["phone_number"] = {
          type: "string",
          description: "User's phone number that received the OTP",
        };
        properties["otp_code"] = {
          type: "string",
          description: "The OTP code entered by user to verify",
        };
        required.push("phone_number", "otp_code");
      } else {
        // Generic query parameter for other tools
        properties["query"] = {
          type: "string",
          description: "User's search query, question, or request",
        };
        required.push("query");
      }
    }

    return { properties, required };
  }

  /**
   * Detect parameters from payload body and query params
   */
  detectParameters(payload) {
    const params = [];
    const seen = new Set();

    // Extract from body template - handle both object and string formats
    let bodyObj = payload.body;

    // If body is a string, try to parse it as JSON
    if (typeof payload.body === "string" && payload.body.trim()) {
      try {
        bodyObj = JSON.parse(payload.body);
      } catch (e) {
        // If not valid JSON, try to extract placeholders from the string directly
        const matches = payload.body.matchAll(/\{\{(\w+)\}\}/g);
        for (const match of matches) {
          const paramName = match[1];
          if (!seen.has(paramName)) {
            params.push({
              name: paramName,
              source: "body",
              originalKey: paramName,
            });
            seen.add(paramName);
          }
        }
        bodyObj = null; // Skip the object processing below
      }
    }

    if (bodyObj && typeof bodyObj === "object") {
      Object.entries(bodyObj).forEach(([key, value]) => {
        if (typeof value === "string" && value.includes("{{")) {
          const placeholderMatch = value.match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const paramName = placeholderMatch[1];
            if (!seen.has(paramName)) {
              params.push({
                name: paramName,
                source: "body",
                originalKey: key,
              });
              seen.add(paramName);
            }
          }
        }
      });
    }

    // Extract from query parameters
    if (payload.params && Array.isArray(payload.params)) {
      payload.params.forEach((param) => {
        if (param.key && param.value) {
          const placeholderMatch = param.value.match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const paramName = placeholderMatch[1];
            if (!seen.has(paramName)) {
              params.push({
                name: paramName,
                source: "query",
                originalKey: param.key,
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
    const exampleText = examples.map((ex) => `"${ex}"`).join(", ");
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
    if (
      apiType.includes("search") ||
      mainParam?.includes("query") ||
      mainParam?.includes("search")
    ) {
      return `Search for products or items. Use this when the user wants to find, search, or browse products. Pass the user's search query naturally.`;
    }

    if (apiType.includes("product")) {
      return `Get product information. Use when user asks about specific products or wants product details.`;
    }

    if (apiType.includes("cart")) {
      return `Add items to shopping cart. Use when user wants to buy or add products to cart.`;
    }

    if (apiType.includes("checkout")) {
      return `Proceed to checkout. Use when user is ready to purchase items in their cart.`;
    }

    if (apiType.includes("order")) {
      return `Manage orders. Use to check order status, history, or details.`;
    }

    // Fallback with parameter hints
    const paramHint = mainParam
      ? `Takes "${mainParam}" parameter from user query`
      : "";
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
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  /**
   * Generate JSON Schema for tool inputs from payload configuration
   */
  generateInputSchema(payload, config) {
    const properties = {};
    const required = [];

    // Only extract actual input parameters, not internal config
    // Skip internal fields like url, method, headers, params, body, name, description
    const internalFields = [
      "url",
      "method",
      "headers",
      "params",
      "body",
      "name",
      "description",
    ];

    // Extract from body template if it exists
    if (payload.body && typeof payload.body === "object") {
      Object.entries(payload.body).forEach(([key, value]) => {
        if (typeof value === "string" && value.includes("{{")) {
          // Extract placeholder: {{query}} or {{search_term}}
          const placeholderMatch = value.match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const paramName = placeholderMatch[1];
            properties[paramName] = {
              type: "string",
              description: this.generateParamDescription(paramName, key),
            };
            required.push(paramName);
          }
        } else if (!internalFields.includes(key)) {
          // Direct parameter (no placeholder)
          properties[key] = {
            type: this.inferType(value),
            description: this.generateParamDescription(key, key),
          };
        }
      });
    }

    // Extract query parameters as inputs (from params array)
    if (payload.params && Array.isArray(payload.params)) {
      payload.params.forEach((param) => {
        if (param.key && param.value) {
          // Check if value contains placeholder like {{search_query}}
          const placeholderMatch = param.value.match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const paramName = placeholderMatch[1];
            if (!properties[paramName]) {
              properties[paramName] = {
                type: "string",
                description: this.generateParamDescription(
                  paramName,
                  param.key
                ),
              };
              required.push(paramName);
            }
          }
        }
      });
    }

    // If no dynamic params found, add a generic query parameter
    if (Object.keys(properties).length === 0) {
      properties["query"] = {
        type: "string",
        description:
          "User's search query, question, or request (pass the user message naturally)",
      };
      required.push("query");
    }

    return { properties, required };
  }

  /**
   * Generate intelligent parameter description
   */
  generateParamDescription(paramName, originalKey) {
    const name = paramName.toLowerCase();

    if (
      name.includes("query") ||
      name.includes("search") ||
      name.includes("q")
    ) {
      return 'What the user is searching for or asking about (e.g., "lipstick", "hair oil", etc.)';
    }

    if (name.includes("message") || name.includes("msg")) {
      return "User's message or query (pass their request naturally)";
    }

    if (name.includes("term") || name.includes("keyword")) {
      return "Search term or keyword from user query";
    }

    if (name.includes("id")) {
      return "Unique identifier";
    }

    if (name.includes("name")) {
      return "Name or title";
    }

    if (name.includes("category")) {
      return "Product category or type";
    }

    if (name.includes("price")) {
      return "Price value or range";
    }

    // Fallback: use the parameter name with better formatting
    return `${originalKey || paramName} value from user query`;
  }

  /**
   * Infer JSON Schema type from value
   */
  inferType(value) {
    if (Array.isArray(value)) return "array";
    if (value === null) return "string";
    const type = typeof value;
    if (type === "object") return "object";
    return type;
  }

  /**
   * Execute a tool (API call)
   */
  async executeTool(merchantId, toolName, args) {
    try {
      console.log(`\n=== Executing Tool: ${toolName} ===`);
      console.log("Merchant ID:", merchantId);
      console.log("Args:", args);

      // Find the API configuration by tool name in payload.name OR payload.mcpConfig.toolName
      let api = await prisma.api.findFirst({
        where: {
          merchantId: parseInt(merchantId),
          payload: { path: ["name"], equals: toolName },
        },
        include: {
          credential: true,
        },
      });

      // If not found by payload.name, try payload.mcpConfig.toolName
      if (!api) {
        api = await prisma.api.findFirst({
          where: {
            merchantId: parseInt(merchantId),
            payload: { path: ["mcpConfig", "toolName"], equals: toolName },
          },
          include: {
            credential: true,
          },
        });
      }

      if (!api) {
        console.log(
          `Tool '${toolName}' not found. Checking all APIs for merchant...`
        );
        const allApis = await prisma.api.findMany({
          where: { merchantId: parseInt(merchantId) },
        });
        console.log(
          "Available APIs:",
          allApis.map((a) => ({
            apiType: a.apiType,
            payloadName: a.payload?.name,
            mcpToolName: a.payload?.mcpConfig?.toolName,
          }))
        );
        throw new Error(`Tool '${toolName}' not found for merchant`);
      }

      console.log("Found API config:", {
        apiType: api.apiType,
        url: api.payload?.url,
        method: api.payload?.method,
      });

      // Prepare API request
      const requestConfig = await this.prepareApiRequest(api, args);
      console.log("Request config:", {
        method: requestConfig.method,
        url: requestConfig.url,
        params: requestConfig.params,
        dataKeys: requestConfig.data ? Object.keys(requestConfig.data) : null,
      });

      // Execute API call
      const response = await axios(requestConfig);
      console.log("API Response status:", response.status);
      console.log(
        "API Response data sample:",
        JSON.stringify(response.data).substring(0, 500)
      );

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Error executing tool:", error.message);
      if (error.response) {
        console.error(
          "Error response:",
          error.response.status,
          error.response.data
        );
      }
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 500,
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
      method: payload.method || config.method || "POST",
      url: payload.url || config.url || config.endpoint,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      // For development: ignore SSL certificate errors
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    };

    // Add headers from payload if they exist
    if (payload.headers && Array.isArray(payload.headers)) {
      payload.headers.forEach((h) => {
        if (h.key && h.value) {
          requestConfig.headers[h.key] = h.value;
        }
      });
    }

    // Add authentication
    if (credential) {
      this.addAuthentication(requestConfig, credential, args);
    }

    // Add request body
    if (["POST", "PUT", "PATCH"].includes(requestConfig.method.toUpperCase())) {
      requestConfig.data = this.buildRequestBody(api.payload, args, config);
    }

    // Add query parameters for GET requests
    if (requestConfig.method.toUpperCase() === "GET") {
      requestConfig.params = this.buildQueryParams(payload, args);
    }

    return requestConfig;
  }

  /**
   * Build query parameters from payload config and args
   * Maps the AI's parameter names to the API's actual parameter names
   */
  buildQueryParams(payload, args) {
    const params = {};

    // Common search parameter keys that should use dynamic query
    const searchParamKeys = [
      "q",
      "query",
      "search",
      "keyword",
      "term",
      "search_term",
    ];

    // Get the dynamic search value from args
    const searchValue =
      args.query || args.q || args.search || args.term || args.keyword;

    // Start with params from payload config
    if (payload.params && Array.isArray(payload.params)) {
      payload.params.forEach((p) => {
        if (p.key && p.value !== undefined) {
          // Check if value is a placeholder like {{query}}
          const placeholderMatch = String(p.value).match(/\{\{(\w+)\}\}/);
          if (placeholderMatch) {
            const argName = placeholderMatch[1];
            // Replace placeholder with actual arg value
            if (args[argName] !== undefined) {
              params[p.key] = args[argName];
            }
          } else if (searchParamKeys.includes(p.key) && searchValue) {
            // For search params, ALWAYS use the dynamic query value
            params[p.key] = searchValue;
          } else {
            // Use static value from config for non-search params
            params[p.key] = p.value;
          }
        }
      });
    }

    // If no search param was set but we have a search value, add it
    const hasSearchParam = searchParamKeys.some(
      (key) => params[key] !== undefined
    );
    if (!hasSearchParam && searchValue) {
      // Try to find the search param key from payload config
      const searchParam = payload.params?.find((p) =>
        searchParamKeys.includes(p.key)
      );
      if (searchParam) {
        params[searchParam.key] = searchValue;
      } else {
        // Default to 'q' which is most common
        params.q = searchValue;
      }
    }

    console.log("Built query params:", params, "from args:", args);
    return params;
  }

  /**
   * Add authentication to request
   */
  addAuthentication(requestConfig, credential, args) {
    switch (credential.authType) {
      case "bearer":
        requestConfig.headers["Authorization"] = `Bearer ${
          args.token || credential.header
        }`;
        break;

      case "api_key":
        if (credential.header) {
          const [headerName, headerValue] = credential.header.split(":");
          requestConfig.headers[headerName.trim()] = headerValue.trim();
        }
        break;

      case "basic":
        if (credential.username && credential.password) {
          const token = Buffer.from(
            `${credential.username}:${credential.password}`
          ).toString("base64");
          requestConfig.headers["Authorization"] = `Basic ${token}`;
        }
        break;

      case "custom":
        if (credential.header) {
          try {
            const customHeaders = JSON.parse(credential.header);
            Object.assign(requestConfig.headers, customHeaders);
          } catch (e) {
            console.error("Error parsing custom headers:", e);
          }
        }
        break;
    }
  }

  /**
   * Build request body from payload template and arguments
   * Preserves static values and only replaces {{placeholders}} with dynamic args
   * Also supports intelligent field mapping when placeholders aren't used
   */
  buildRequestBody(payload, args, config) {
    if (!payload) return args;

    // Get the body template from payload
    let bodyTemplate = payload.body;

    // If no body template defined, use args directly
    if (!bodyTemplate) {
      console.log("No body template defined, using args directly:", args);
      return args;
    }

    // Parse body if it's a string (JSON)
    if (typeof bodyTemplate === "string") {
      try {
        bodyTemplate = JSON.parse(bodyTemplate);
      } catch (e) {
        console.error("Error parsing body template as JSON:", e.message);
        console.log("Body template string:", bodyTemplate);
        // If it's not valid JSON, try to replace placeholders in the string
        const result = this.replacePlaceholders(bodyTemplate, args);
        console.log("Replaced string body:", result);
        try {
          return JSON.parse(result);
        } catch (e2) {
          return result;
        }
      }
    }

    // Deep clone body template
    const body = JSON.parse(JSON.stringify(bodyTemplate));

    console.log("Body template before replacement:", body);
    console.log("Args for replacement:", args);

    // First, replace {{placeholders}} with actual values
    let result = this.replacePlaceholders(body, args);

    // Then, apply intelligent field mapping for common field names
    // This handles cases where the body has static values but the arg names differ
    result = this.applyFieldMapping(result, args);

    console.log("Final request body:", result);
    return result;
  }

  /**
   * Apply intelligent field mapping between arg names and body field names
   * Maps common variations like phone_number -> mobile, otp_code -> otp
   */
  applyFieldMapping(body, args) {
    if (typeof body !== "object" || body === null) return body;

    // Define field mappings: argName -> possible body field names
    const fieldMappings = {
      phone_number: [
        "mobile",
        "phone",
        "phoneNumber",
        "phone_number",
        "mobileNumber",
        "mobile_number",
        "number",
      ],
      otp_code: [
        "otp",
        "code",
        "otpCode",
        "otp_code",
        "verificationCode",
        "verification_code",
      ],
      email: ["email", "emailAddress", "email_address", "emailId", "email_id"],
      query: [
        "q",
        "query",
        "search",
        "keyword",
        "searchQuery",
        "search_query",
        "term",
      ],
      product_id: ["productId", "product_id", "id", "itemId", "item_id"],
      quantity: ["quantity", "qty", "count", "amount"],
    };

    // For each arg, check if it maps to a body field
    for (const [argName, argValue] of Object.entries(args)) {
      const possibleFields = fieldMappings[argName] || [argName];

      for (const fieldName of possibleFields) {
        if (body.hasOwnProperty(fieldName)) {
          // Check if the field has a placeholder or a different value
          const currentValue = body[fieldName];
          // Only replace if it's a static value (not a placeholder pattern) or matches a phone/number pattern
          if (
            typeof currentValue === "string" &&
            !currentValue.includes("{{")
          ) {
            console.log(
              `Mapping arg '${argName}' (${argValue}) to body field '${fieldName}'`
            );
            body[fieldName] = argValue;
            break; // Use first matching field
          }
        }
      }
    }

    return body;
  }

  /**
   * Recursively replace placeholders in object
   */
  replacePlaceholders(obj, args) {
    if (typeof obj === "string") {
      // Replace {{placeholder}} with actual value
      return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return args[key] !== undefined ? args[key] : match;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.replacePlaceholders(item, args));
    }

    if (obj && typeof obj === "object") {
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
