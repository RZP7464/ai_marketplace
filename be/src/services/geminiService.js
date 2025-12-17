const { GoogleGenerativeAI } = require('@google/generative-ai');
const mcpService = require('./mcpService');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }
  }

  /**
   * Convert MCP tools to Gemini function declarations
   */
  convertMCPToolsToGemini(mcpTools) {
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

  /**
   * Chat with Gemini using MCP tools
   */
  async chatWithTools(merchantId, userMessage, conversationHistory = []) {
    try {
      // Get merchant's MCP tools
      const { tools: mcpTools } = await mcpService.getMerchantTools(merchantId);

      // Convert MCP tools to Gemini function declarations
      const functions = this.convertMCPToolsToGemini(mcpTools);

      // Build conversation history for Gemini
      const chat = this.model.startChat({
        history: conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        tools: functions.length > 0 ? [{
          functionDeclarations: functions
        }] : undefined
      });

      // Send message to Gemini
      const result = await chat.sendMessage(userMessage);
      const response = result.response;

      // Check if Gemini wants to call a function
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        // Execute all requested functions via MCP
        const functionResults = await Promise.all(
          functionCalls.map(async (call) => {
            try {
              console.log(`Executing MCP tool: ${call.name}`, call.args);
              
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
                  error: result.error
                }
              };
            } catch (error) {
              console.error(`Error executing tool ${call.name}:`, error);
              return {
                name: call.name,
                response: {
                  success: false,
                  error: error.message
                }
              };
            }
          })
        );

        // Send function results back to Gemini
        const functionResultsMessage = functionResults.map(fr => ({
          functionResponse: {
            name: fr.name,
            response: fr.response
          }
        }));

        const finalResult = await chat.sendMessage(functionResultsMessage);
        const finalText = finalResult.response.text();

        return {
          response: finalText,
          functionCalls: functionCalls.map(fc => ({
            name: fc.name,
            args: fc.args
          })),
          functionResults: functionResults.map(fr => ({
            tool: fr.name,
            success: fr.response.success,
            data: fr.response.data,
            error: fr.response.error
          }))
        };
      }

      // No function calls, just return the text response
      const text = response.text();
      return {
        response: text,
        functionCalls: [],
        functionResults: []
      };

    } catch (error) {
      console.error('Gemini chat error:', error);
      throw error;
    }
  }

  /**
   * Simple chat without tools (for testing)
   */
  async simpleChat(message, conversationHistory = []) {
    try {
      const chat = this.model.startChat({
        history: conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      });

      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();

      return { response: text };
    } catch (error) {
      console.error('Gemini simple chat error:', error);
      throw error;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return [
      { id: 'gemini-pro', name: 'Gemini Pro' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' }
    ];
  }

  /**
   * Test API key
   */
  async testApiKey(apiKey) {
    try {
      const testAI = new GoogleGenerativeAI(apiKey);
      const testModel = testAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-pro' });
      
      const result = await testModel.generateContent('Hello');
      const response = result.response;
      const text = response.text();
      
      return { success: true, message: 'API key is valid', response: text };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new GeminiService();

