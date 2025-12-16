const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const prisma = require('../lib/prisma');
const mcpService = require('./mcpService');

// Default Gemini API key (from environment variable)
const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash-lite';

class AIService {
  /**
   * Get AI configuration for merchant (with Gemini fallback)
   */
  async getAIConfig(merchantId) {
    const config = await prisma.aiConfiguration.findFirst({
      where: {
        merchantId: parseInt(merchantId),
        isActive: true
      }
    });

    // If no config found, return default Gemini config
    if (!config) {
      console.log(`No AI config for merchant ${merchantId}, using default Gemini`);
      return {
        provider: 'gemini',
        apiKey: DEFAULT_GEMINI_KEY,
        model: DEFAULT_GEMINI_MODEL,
        isActive: true,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
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
      case 'gemini':
        return {
          provider: 'gemini',
          client: new GoogleGenerativeAI(config.apiKey),
          model: config.model,
          config: config.config
        };

      case 'openai':
        return {
          provider: 'openai',
          client: new OpenAI({ apiKey: config.apiKey }),
          model: config.model,
          config: config.config
        };

      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * Convert MCP tools to provider-specific format
   */
  convertMCPToolsToFormat(mcpTools, provider) {
    if (provider === 'gemini') {
      return mcpTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.inputSchema.properties || {},
          required: tool.inputSchema.required || []
        }
      }));
    }

    if (provider === 'openai') {
      return mcpTools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema
        }
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
      const { tools: mcpTools } = await mcpService.getMerchantTools(merchantId);
      const functions = this.convertMCPToolsToFormat(mcpTools, 'gemini');

      // Build chat
      const chat = model.startChat({
        history: conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: aiConfig.config?.temperature || 0.7,
          topK: aiConfig.config?.topK || 1,
          topP: aiConfig.config?.topP || 1,
          maxOutputTokens: aiConfig.config?.maxOutputTokens || 2048,
        },
        tools: functions.length > 0 ? [{ functionDeclarations: functions }] : undefined
      });

      // Send message
      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const functionCalls = response.functionCalls();

      // Handle function calls
      if (functionCalls && functionCalls.length > 0) {
        const functionResults = await Promise.all(
          functionCalls.map(async (call) => {
            const result = await mcpService.executeTool(merchantId, call.name, call.args);
            return {
              name: call.name,
              response: { success: result.success, data: result.data, error: result.error }
            };
          })
        );

        const finalResult = await chat.sendMessage(
          functionResults.map(fr => ({
            functionResponse: { name: fr.name, response: fr.response }
          }))
        );

        return {
          response: finalResult.response.text(),
          functionCalls: functionCalls.map(fc => ({ name: fc.name, args: fc.args })),
          functionResults: functionResults.map(fr => ({
            tool: fr.name,
            success: fr.response.success,
            data: fr.response.data,
            error: fr.response.error
          }))
        };
      }

      return {
        response: response.text(),
        functionCalls: [],
        functionResults: []
      };
    } catch (error) {
      console.error('Gemini chat error:', error);
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
      const { tools: mcpTools } = await mcpService.getMerchantTools(merchantId);
      const functions = this.convertMCPToolsToFormat(mcpTools, 'openai');

      // Build messages
      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: aiConfig.model,
        messages,
        tools: functions.length > 0 ? functions : undefined,
        tool_choice: functions.length > 0 ? 'auto' : undefined,
        temperature: aiConfig.config?.temperature || 0.7,
        max_tokens: aiConfig.config?.maxTokens || 2048
      });

      const responseMessage = completion.choices[0].message;

      // Handle tool calls
      if (responseMessage.tool_calls) {
        const functionResults = await Promise.all(
          responseMessage.tool_calls.map(async (toolCall) => {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await mcpService.executeTool(merchantId, toolCall.function.name, args);
            return {
              tool: toolCall.function.name,
              success: result.success,
              data: result.data,
              error: result.error
            };
          })
        );

        // Send function results back to OpenAI
        const followUpMessages = [
          ...messages,
          responseMessage,
          ...responseMessage.tool_calls.map((toolCall, idx) => ({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResults[idx])
          }))
        ];

        const finalCompletion = await openai.chat.completions.create({
          model: aiConfig.model,
          messages: followUpMessages
        });

        return {
          response: finalCompletion.choices[0].message.content,
          functionCalls: responseMessage.tool_calls.map(tc => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments)
          })),
          functionResults
        };
      }

      return {
        response: responseMessage.content,
        functionCalls: [],
        functionResults: []
      };
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw error;
    }
  }

  /**
   * Main chat method that routes to appropriate provider
   */
  async chat(merchantId, userMessage, conversationHistory = []) {
    try {
      const aiConfig = await this.initializeAI(merchantId);

      if (aiConfig.provider === 'gemini') {
        return await this.chatWithGemini(aiConfig, merchantId, userMessage, conversationHistory);
      }

      if (aiConfig.provider === 'openai') {
        return await this.chatWithOpenAI(aiConfig, merchantId, userMessage, conversationHistory);
      }

      throw new Error(`Unsupported provider: ${aiConfig.provider}`);
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  }

  /**
   * Test API key for a provider
   */
  async testApiKey(provider, apiKey, model) {
    try {
      if (provider === 'gemini') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const testModel = genAI.getGenerativeModel({ model });
        const result = await testModel.generateContent('Hello');
        return { success: true, message: 'Gemini API key is valid', response: result.response.text() };
      }

      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 50
        });
        return { success: true, message: 'OpenAI API key is valid', response: completion.choices[0].message.content };
      }

      return { success: false, message: 'Unsupported provider' };
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
        id: 'gemini',
        name: 'Google Gemini',
        models: [
          { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash (Recommended)' },
          { id: 'gemini-pro', name: 'Gemini Pro' },
          { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' }
        ]
      },
      {
        id: 'openai',
        name: 'OpenAI',
        models: [
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
        ]
      }
    ];
  }
}

module.exports = new AIService();

