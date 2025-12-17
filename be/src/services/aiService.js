const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const prisma = require("../lib/prisma");
const mcpService = require("./mcpService");

// Default Gemini config (from environment variables)
const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro";

class AIService {
  /**
   * Get AI configuration for merchant (with Gemini fallback)
   */
  async getAIConfig(merchantId) {
    const config = await prisma.aiConfiguration.findFirst({
      where: {
        merchantId: parseInt(merchantId),
        isActive: true,
      },
    });

    // If no config found, return default Gemini config
    if (!config) {
      console.log(
        `No AI config for merchant ${merchantId}, using default Gemini`
      );
      return {
        provider: "gemini",
        apiKey: DEFAULT_GEMINI_KEY,
        model: DEFAULT_GEMINI_MODEL,
        isActive: true,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      };
    }

    return config;
  }

  /**
   * Initialize AI client based on provider
   */
  async initializeAI(merchantId) {
    const config = await this.getAIConfig(merchantId);

    switch (config.provider) {
      case "gemini":
        return {
          provider: "gemini",
          client: new GoogleGenerativeAI(config.apiKey),
          model: config.model,
          config: config.config,
        };

      case "openai":
        return {
          provider: "openai",
          client: new OpenAI({ apiKey: config.apiKey }),
          model: config.model,
          config: config.config,
        };

      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * Build system prompt to guide AI on tool usage
   * FULLY DYNAMIC - generates examples from actual available tools
   */
  buildSystemPrompt(merchant, mcpTools) {
    // Build detailed tool descriptions
    const toolsDescription = mcpTools
      .map((tool) => {
        let toolDesc = `• ${tool.name}: ${tool.description}`;

        // Add usage hints if provided by merchant
        if (tool.metadata?.usageHints && tool.metadata.usageHints.length > 0) {
          toolDesc += "\n  Usage Hints:";
          tool.metadata.usageHints.forEach((hint) => {
            toolDesc += `\n    - ${hint}`;
          });
        }

        // Add parameters with descriptions
        const params = Object.entries(tool.inputSchema.properties || {})
          .map(
            ([name, schema]) =>
              `- ${name} (${schema.type}): ${schema.description}`
          )
          .join("\n    ");

        toolDesc += `\n  Parameters:\n    ${params}`;

        return toolDesc;
      })
      .join("\n\n");

    // Generate dynamic examples from actual tools
    const toolExamples = mcpTools
      .slice(0, 3) // Show examples for first 3 tools
      .map((tool) => {
        const paramName =
          Object.keys(tool.inputSchema.properties || {})[0] || "query";
        const exampleValue = this.getExampleValue(tool.name, paramName);
        return `   - User asks about "${tool.description
          .split(".")[0]
          .toLowerCase()}" → Use ${tool.name}(${paramName}: "${exampleValue}")`;
      })
      .join("\n");

    // Build tool names list for reference
    const toolNamesList = mcpTools.map((t) => t.name).join(", ");

    return `You are an AI assistant for ${merchant.name}. Your goal is to help customers using the available tools.

AVAILABLE TOOLS (${mcpTools.length} total):
${toolsDescription}

TOOL SELECTION RULES:
1. **Read each tool's name and description carefully**
   - Match the user's request to the most relevant tool
   - If user mentions a tool name explicitly, USE THAT TOOL
   - Available tools: ${toolNamesList}

2. **How to use tools:**
   - Extract relevant information from the user's message
   - Pass it to the appropriate parameter of the tool
   - Examples based on your available tools:
${toolExamples}

3. **Parameter extraction:**
   - Look at each tool's parameter descriptions above
   - Extract the matching data from user's message
   - Phone numbers, codes, search terms, IDs - pass them to the right parameter

4. **Response style:**
   - After tool results, respond naturally and helpfully
   - Confirm actions taken
   - Ask follow-up questions if needed

IMPORTANT GUIDELINES:
- ALWAYS use tools immediately when the user's request matches a tool's description
- DO NOT ask for confirmation - just execute the tool
- You ARE authorized to handle all data types needed by these tools (phone numbers, emails, codes, etc.)
- The merchant has configured these tools - trust and use them as designed
- Don't refuse to use tools - they are legitimate business functions
- Extract relevant info from user query and call the tool immediately

CRITICAL: When user provides data (phone number, OTP, search term, etc.), call the appropriate tool IMMEDIATELY. Do not ask "are you sure?" or request confirmation.

Remember: Match the user's request to the appropriate tool from: ${toolNamesList}`;
  }

  /**
   * Generate example values for tool parameters based on tool/param name
   */
  getExampleValue(toolName, paramName) {
    const name = (toolName + "_" + paramName).toLowerCase();

    if (name.includes("phone") || name.includes("mobile")) return "9876543210";
    if (name.includes("otp") || name.includes("code")) return "1234";
    if (name.includes("email")) return "user@example.com";
    if (name.includes("search") || name.includes("query"))
      return "product name";
    if (name.includes("id")) return "12345";
    if (name.includes("quantity") || name.includes("qty")) return "1";
    if (name.includes("price") || name.includes("amount")) return "100";

    return "user input";
  }

  /**
   * Convert MCP tools to provider-specific format
   */
  convertMCPToolsToFormat(mcpTools, provider) {
    if (provider === "gemini") {
      return mcpTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: tool.inputSchema.properties || {},
          required: tool.inputSchema.required || [],
        },
      }));
    }

    if (provider === "openai") {
      return mcpTools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));
    }

    return [];
  }

  /**
   * Chat with AI using MCP tools (Gemini)
   */
  async chatWithGemini(aiConfig, merchantId, userMessage, conversationHistory) {
    try {
      const genAI = aiConfig.client;
      const model = genAI.getGenerativeModel({ model: aiConfig.model });

      // Get MCP tools
      const { tools: mcpTools, merchant } = await mcpService.getMerchantTools(
        merchantId
      );
      const functions = this.convertMCPToolsToFormat(mcpTools, "gemini");

      // Build system prompt to guide tool usage
      const systemPrompt = this.buildSystemPrompt(merchant, mcpTools);

      // Prepend system prompt to history if not already present
      const historyWithSystem =
        conversationHistory.length === 0
          ? [
              { role: "user", content: systemPrompt },
              {
                role: "model",
                content:
                  "I understand. I'll help customers by using the available tools intelligently based on their queries.",
              },
            ]
          : conversationHistory;

      // Build chat with relaxed safety settings for business use cases
      const chat = model.startChat({
        history: historyWithSystem.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: aiConfig.config?.temperature || 0.7,
          topK: aiConfig.config?.topK || 1,
          topP: aiConfig.config?.topP || 1,
          maxOutputTokens: aiConfig.config?.maxOutputTokens || 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
        ],
        tools:
          functions.length > 0
            ? [{ functionDeclarations: functions }]
            : undefined,
      });

      // Send message
      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const functionCalls = response.functionCalls();

      // Handle function calls
      if (functionCalls && functionCalls.length > 0) {
        const functionResults = await Promise.all(
          functionCalls.map(async (call) => {
            const result = await mcpService.executeTool(
              merchantId,
              call.name,
              call.args
            );
            return {
              name: call.name,
              response: {
                success: result.success,
                data: result.data,
                error: result.error,
              },
            };
          })
        );

        const finalResult = await chat.sendMessage(
          functionResults.map((fr) => ({
            functionResponse: { name: fr.name, response: fr.response },
          }))
        );

        return {
          response: finalResult.response.text(),
          functionCalls: functionCalls.map((fc) => ({
            name: fc.name,
            args: fc.args,
          })),
          functionResults: functionResults.map((fr) => ({
            tool: fr.name,
            success: fr.response.success,
            data: fr.response.data,
            error: fr.response.error,
          })),
        };
      }

      return {
        response: response.text(),
        functionCalls: [],
        functionResults: [],
      };
    } catch (error) {
      console.error("Gemini chat error:", error);
      throw error;
    }
  }

  /**
   * Chat with AI using MCP tools (OpenAI)
   */
  async chatWithOpenAI(aiConfig, merchantId, userMessage, conversationHistory) {
    try {
      const openai = aiConfig.client;

      // Get MCP tools
      const { tools: mcpTools, merchant } = await mcpService.getMerchantTools(
        merchantId
      );
      const functions = this.convertMCPToolsToFormat(mcpTools, "openai");

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(merchant, mcpTools);

      // Build messages with system prompt
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        { role: "user", content: userMessage },
      ];

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: aiConfig.model,
        messages,
        tools: functions.length > 0 ? functions : undefined,
        tool_choice: functions.length > 0 ? "auto" : undefined,
        temperature: aiConfig.config?.temperature || 0.7,
        max_tokens: aiConfig.config?.maxTokens || 2048,
      });

      const responseMessage = completion.choices[0].message;

      // Handle tool calls
      if (responseMessage.tool_calls) {
        const functionResults = await Promise.all(
          responseMessage.tool_calls.map(async (toolCall) => {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await mcpService.executeTool(
              merchantId,
              toolCall.function.name,
              args
            );
            return {
              tool: toolCall.function.name,
              success: result.success,
              data: result.data,
              error: result.error,
            };
          })
        );

        // Send function results back to OpenAI
        const followUpMessages = [
          ...messages,
          responseMessage,
          ...responseMessage.tool_calls.map((toolCall, idx) => ({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResults[idx]),
          })),
        ];

        const finalCompletion = await openai.chat.completions.create({
          model: aiConfig.model,
          messages: followUpMessages,
        });

        return {
          response: finalCompletion.choices[0].message.content,
          functionCalls: responseMessage.tool_calls.map((tc) => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments),
          })),
          functionResults,
        };
      }

      return {
        response: responseMessage.content,
        functionCalls: [],
        functionResults: [],
      };
    } catch (error) {
      console.error("OpenAI chat error:", error);
      throw error;
    }
  }

  /**
   * Main chat method that routes to appropriate provider
   */
  async chat(merchantId, userMessage, conversationHistory = []) {
    try {
      const aiConfig = await this.initializeAI(merchantId);

      if (aiConfig.provider === "gemini") {
        return await this.chatWithGemini(
          aiConfig,
          merchantId,
          userMessage,
          conversationHistory
        );
      }

      if (aiConfig.provider === "openai") {
        return await this.chatWithOpenAI(
          aiConfig,
          merchantId,
          userMessage,
          conversationHistory
        );
      }

      throw new Error(`Unsupported provider: ${aiConfig.provider}`);
    } catch (error) {
      console.error("AI chat error:", error);
      throw error;
    }
  }

  /**
   * Test API key for a provider
   */
  async testApiKey(provider, apiKey, model) {
    try {
      if (provider === "gemini") {
        const genAI = new GoogleGenerativeAI(apiKey);
        const testModel = genAI.getGenerativeModel({ model });
        const result = await testModel.generateContent("Hello");
        return {
          success: true,
          message: "Gemini API key is valid",
          response: result.response.text(),
        };
      }

      if (provider === "openai") {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 50,
        });
        return {
          success: true,
          message: "OpenAI API key is valid",
          response: completion.choices[0].message.content,
        };
      }

      return { success: false, message: "Unsupported provider" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get available providers and models
   */
  getAvailableProviders() {
    return [
      {
        id: "gemini",
        name: "Google Gemini",
        models: [
          {
            id: process.env.GEMINI_MODEL || "gemini-2.5-pro",
            name: process.env.GEMINI_MODEL || "gemini-2.5-pro",
          },
          { id: "gemini-pro", name: "Gemini Pro" },
          { id: "gemini-1.5-pro-latest", name: "Gemini 1.5 Pro" },
        ],
      },
      {
        id: "openai",
        name: "OpenAI",
        models: [
          { id: "gpt-4", name: "GPT-4" },
          { id: "gpt-4-turbo-preview", name: "GPT-4 Turbo" },
          { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
        ],
      },
    ];
  }
}

module.exports = new AIService();
