const express = require('express');
const prisma = require('../lib/prisma');
const mcpService = require('../services/mcpService');
const aiService = require('../services/aiService');
const responseNormalizerService = require('../services/responseNormalizerService');

const router = express.Router();

/**
 * Get merchant info by ID (public)
 * GET /api/chat/merchant/:merchantId
 */
router.get('/merchant/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(merchantId) },
      select: {
        id: true,
        name: true,
        slug: true,
        displayName: true,
        logo: true,
        tagline: true,
        welcomeMessage: true,
        categories: true,
        description: true,
        dynamicSettings: {
          select: {
            primaryColor: true,
            secondaryColor: true,
            accentColor: true
          }
        }
      }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      data: merchant
    });
  } catch (error) {
    console.error('Get merchant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchant'
    });
  }
});

/**
 * Create a new chat session for a merchant
 * GET /api/chat/:merchantId/new
 * 
 * Returns: New session with merchant details
 */
router.get('/:merchantId/new', async (req, res) => {
  try {
    const { merchantId } = req.params;

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(merchantId) },
      select: {
        id: true,
        name: true,
        slug: true,
        displayName: true,
        logo: true,
        tagline: true,
        welcomeMessage: true,
        categories: true,
        dynamicSettings: {
          select: {
            primaryColor: true,
            secondaryColor: true,
            accentColor: true
          }
        }
      }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    // Create new session
    const session = await prisma.session.create({
      data: {
        merchantId: parseInt(merchantId)
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        merchantId: merchant.id,
        merchant: merchant,
        createdAt: session.createdAt,
        redirectUrl: `/chat/${merchant.id}/${session.id}`
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

/**
 * Get session details and chat history
 * GET /api/chat/:merchantId/:sessionId
 */
router.get('/:merchantId/:sessionId', async (req, res) => {
  try {
    const { merchantId, sessionId } = req.params;

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(merchantId) },
      select: {
        id: true,
        name: true,
        slug: true,
        displayName: true,
        logo: true,
        tagline: true,
        welcomeMessage: true,
        categories: true,
        dynamicSettings: {
          select: {
            primaryColor: true,
            secondaryColor: true,
            accentColor: true
          }
        }
      }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    // Get session with chat history
    const session = await prisma.session.findFirst({
      where: {
        id: parseInt(sessionId),
        merchantId: parseInt(merchantId)
      },
      include: {
        chats: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Parse chat history
    const chatHistory = session.chats.map(chat => {
      // Handle both old format (user: message) and new format (JSON)
      if (chat.message.startsWith('user:') || chat.message.startsWith('assistant:')) {
        const isUser = chat.message.startsWith('user:');
        return {
          id: chat.id,
          type: isUser ? 'user' : 'assistant',
          text: isUser ? chat.message.replace('user: ', '') : chat.message.replace('assistant: ', ''),
          timestamp: chat.createdAt
        };
      }
      
      try {
        const parsed = JSON.parse(chat.message);
        return {
          id: chat.id,
          type: parsed.role === 'user' ? 'user' : 'assistant',
          text: parsed.content,
          timestamp: chat.createdAt,
          toolsUsed: parsed.toolsUsed,
          tools: parsed.tools,
          toolResults: parsed.toolResults
        };
      } catch (e) {
        return {
          id: chat.id,
          type: 'user',
          text: chat.message,
          timestamp: chat.createdAt
        };
      }
    });

    // Get MCP tools
    const { tools } = await mcpService.getMerchantTools(parseInt(merchantId));

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        merchantId: merchant.id,
        merchant: merchant,
        chatHistory: chatHistory,
        mcpTools: tools.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema
        })),
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session'
    });
  }
});

/**
 * Chat endpoint with session - URL-based merchantId and sessionId
 * POST /api/chat/:merchantId/:sessionId
 * 
 * Body: { message: string }
 */
router.post('/:merchantId/:sessionId', async (req, res) => {
  try {
    const { merchantId, sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Verify merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(merchantId) }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    // Verify session exists and belongs to this merchant
    let session = await prisma.session.findFirst({
      where: {
        id: parseInt(sessionId),
        merchantId: parseInt(merchantId)
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Save user message
    await prisma.chat.create({
      data: {
        sessionId: session.id,
        merchantId: merchant.id,
        message: `user: ${message}`
      }
    });

    // Get conversation history from this session
    const previousChats = await prisma.chat.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20 // Last 20 messages for context
    });

    const conversationHistory = previousChats.map(chat => {
      // Handle both old format (user: message) and new format (JSON)
      if (chat.message.startsWith('user:') || chat.message.startsWith('assistant:')) {
        const isUser = chat.message.startsWith('user:');
        return {
          role: isUser ? 'user' : 'assistant',
          content: isUser ? chat.message.replace('user: ', '') : chat.message.replace('assistant: ', '')
        };
      }
      
      try {
        const parsed = JSON.parse(chat.message);
        const historyItem = {
          role: parsed.role,
          content: parsed.content
        };
        
        // Include tool calls and results in history for AI context
        // This is crucial for multi-step flows like OTP verification
        if (parsed.toolCalls && parsed.toolCalls.length > 0) {
          // Format tool call results as part of the content for AI to see
          const toolCallSummary = parsed.toolCalls.map(tc => {
            let summary = `[Tool: ${tc.name}]`;
            if (tc.args) summary += ` Args: ${JSON.stringify(tc.args)}`;
            if (tc.result?.data) summary += ` Result: ${JSON.stringify(tc.result.data)}`;
            return summary;
          }).join('\n');
          
          historyItem.content = `${parsed.content}\n\n--- Tool Calls ---\n${toolCallSummary}`;
          historyItem.toolCalls = parsed.toolCalls; // Keep structured data too
        }
        
        return historyItem;
      } catch (e) {
        return { role: 'user', content: chat.message };
      }
    });

    console.log(`\n=== Chat Session ===`);
    console.log(`Merchant: ${merchant.name} (ID: ${merchantId})`);
    console.log(`Session: ${sessionId}`);
    console.log(`History length: ${conversationHistory.length} messages`);
    console.log(`User message: ${message}`);
    console.log(`Conversation History:`, JSON.stringify(conversationHistory, null, 2));

    // Get AI response with conversation history as context
    const aiResponse = await aiService.chat(merchant.id, message, conversationHistory);

    // Save assistant message with tool calls and results
    const responseText = aiResponse.response || aiResponse.message || 'Sorry, I could not generate a response.';
    
    // Create rich message format with tool call info
    const assistantMessageData = {
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString()
    };

    // Include tool calls if any
    if (aiResponse.functionCalls?.length > 0) {
      assistantMessageData.toolCalls = aiResponse.functionCalls.map((fc, idx) => ({
        name: fc.name,
        args: fc.args,
        result: aiResponse.functionResults?.[idx] || null
      }));
    }

    await prisma.chat.create({
      data: {
        sessionId: session.id,
        merchantId: merchant.id,
        message: JSON.stringify(assistantMessageData)
      }
    });

    // Process tool results
    let toolResult = null;
    let allToolResults = [];
    
    if (aiResponse.functionResults?.length > 0) {
      const successfulResults = aiResponse.functionResults.filter(fr => fr.success);
      
      allToolResults = await Promise.all(
        successfulResults.map(async (result, idx) => {
          try {
            const toolName = aiResponse.functionCalls?.[idx]?.name || 'unknown';
            const normalized = await responseNormalizerService.normalizeToolResult(
              toolName,
              result,
              { merchantId: merchant.id, merchantName: merchant.name }
            );
            return {
              toolName,
              success: true,
              ...normalized
            };
          } catch (error) {
            console.error('Error normalizing result:', error);
            return {
              toolName: aiResponse.functionCalls?.[idx]?.name || 'unknown',
              success: result.success,
              products: [],
              summary: 'Error processing results',
              raw: result.data
            };
          }
        })
      );
      
      const firstSuccess = allToolResults.find(tr => tr.products?.length > 0);
      if (firstSuccess) {
        toolResult = firstSuccess.products;
      }
    }

    res.json({
      success: true,
      data: {
        response: responseText,
        sessionId: session.id,
        merchantId: merchant.id,
        toolsUsed: aiResponse.functionCalls?.length > 0,
        toolResult: toolResult,
        toolResults: allToolResults,
        tools: aiResponse.functionCalls?.map(fc => fc.name) || []
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Public chat endpoint (backward compatibility) - No authentication required
 * POST /api/chat/public/:merchantSlug
 * 
 * Body: { message: string, sessionId: string }
 */
router.post('/public/:merchantSlug', async (req, res) => {
  try {
    const { merchantSlug } = req.params;
    const { message, sessionId: clientSessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Find merchant by slug
    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    // Find or create session (using latest session for this merchant or create new)
    let session = await prisma.session.findFirst({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!session) {
      session = await prisma.session.create({
        data: {
          merchantId: merchant.id
        }
      });
    }

    // Save user message
    await prisma.chat.create({
      data: {
        sessionId: session.id,
        merchantId: merchant.id,
        message: `user: ${message}`
      }
    });

    // Get conversation history
    const previousChats = await prisma.chat.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 10 // Last 10 messages for context
    });

    const conversationHistory = previousChats.map(chat => {
      // Handle both old format (user: message) and new format (JSON)
      if (chat.message.startsWith('user:') || chat.message.startsWith('assistant:')) {
        const isUser = chat.message.startsWith('user:');
        return {
          role: isUser ? 'user' : 'assistant',
          content: isUser ? chat.message.replace('user: ', '') : chat.message.replace('assistant: ', '')
        };
      }
      
      try {
        const parsed = JSON.parse(chat.message);
        const historyItem = {
          role: parsed.role,
          content: parsed.content
        };
        
        // Include tool calls and results in history for AI context
        if (parsed.toolCalls && parsed.toolCalls.length > 0) {
          const toolCallSummary = parsed.toolCalls.map(tc => {
            let summary = `[Tool: ${tc.name}]`;
            if (tc.args) summary += ` Args: ${JSON.stringify(tc.args)}`;
            if (tc.result?.data) summary += ` Result: ${JSON.stringify(tc.result.data)}`;
            return summary;
          }).join('\n');
          
          historyItem.content = `${parsed.content}\n\n--- Tool Calls ---\n${toolCallSummary}`;
          historyItem.toolCalls = parsed.toolCalls;
        }
        
        return historyItem;
      } catch (e) {
        return { role: 'user', content: chat.message };
      }
    });

    // Get AI response using merchant's AI service (with Gemini fallback)
    const aiResponse = await aiService.chat(merchant.id, message, conversationHistory);

    // Save assistant message with tool calls and results
    const responseText = aiResponse.response || aiResponse.message || 'Sorry, I could not generate a response.';
    
    // Create rich message format with tool call info
    const assistantMessageData = {
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString()
    };

    // Include tool calls if any
    if (aiResponse.functionCalls?.length > 0) {
      assistantMessageData.toolCalls = aiResponse.functionCalls.map((fc, idx) => ({
        name: fc.name,
        args: fc.args,
        result: aiResponse.functionResults?.[idx] || null
      }));
    }

    await prisma.chat.create({
      data: {
        sessionId: session.id,
        merchantId: merchant.id,
        message: JSON.stringify(assistantMessageData)
      }
    });

    // Extract ALL tool results for dynamic rendering (images, products, etc.)
    let toolResult = null;
    let allToolResults = [];
    
    if (aiResponse.functionResults?.length > 0) {
      // Include all successful tool results and normalize them using AI
      const successfulResults = aiResponse.functionResults.filter(fr => fr.success);
      
      // Normalize each result using AI to understand and format any API response
      allToolResults = await Promise.all(
        successfulResults.map(async (result, idx) => {
          try {
            const toolName = aiResponse.functionCalls?.[idx]?.name || 'unknown';
            // Use AI-powered normalization to understand any response format
            const normalized = await responseNormalizerService.normalizeToolResult(
              toolName,
              result,
              { merchantId: merchant.id, merchantName: merchant.name }
            );
            return {
              toolName,
              success: true,
              ...normalized
            };
          } catch (error) {
            console.error('Error normalizing result:', error);
            return {
              toolName: aiResponse.functionCalls?.[idx]?.name || 'unknown',
              success: result.success,
              products: [],
              summary: 'Error processing results',
              raw: result.data
            };
          }
        })
      );
      
      // For backward compatibility, keep the first successful result as toolResult
      const firstSuccess = allToolResults.find(tr => tr.products?.length > 0);
      if (firstSuccess) {
        toolResult = firstSuccess.products;
      }
    }

    res.json({
      success: true,
      data: {
        response: responseText,
        sessionId: session.id,
        merchantId: merchant.id,
        toolsUsed: aiResponse.functionCalls?.length > 0,
        toolResult: toolResult, // For backward compatibility
        toolResults: allToolResults, // All normalized tool results for dynamic rendering
        tools: aiResponse.functionCalls?.map(fc => fc.name) || []
      }
    });
  } catch (error) {
    console.error('Public chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Create a new chat session for a merchant
 * POST /api/chat/sessions
 * 
 * Body: { merchantId: number }
 */
router.post('/sessions', async (req, res) => {
  try {
    const { merchantId } = req.body;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
    }

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(merchantId) }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    // Create new session
    const session = await prisma.session.create({
      data: {
        merchantId: parseInt(merchantId)
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        merchantId: session.merchantId,
        merchant: session.merchant,
        createdAt: session.createdAt,
        mcpEndpoint: `/api/mcp/${session.merchantId}`
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

/**
 * Get session details with MCP info
 * GET /api/chat/sessions/:sessionId
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        chats: {
          orderBy: { createdAt: 'asc' },
          take: 50 // Last 50 messages
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Get MCP tools for this merchant
    const { tools } = await mcpService.getMerchantTools(session.merchantId);

    res.json({
      success: true,
      session: {
        id: session.id,
        merchantId: session.merchantId,
        merchant: session.merchant,
        createdAt: session.createdAt,
        mcpEndpoint: `/api/mcp/${session.merchantId}`,
        availableTools: tools.map(t => ({
          name: t.name,
          description: t.description
        })),
        messages: session.chats
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session'
    });
  }
});

/**
 * Send a message in a session
 * POST /api/chat/sessions/:sessionId/messages
 * 
 * Body: { message: string, role: 'user' | 'assistant' }
 */
router.post('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, role = 'user' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required'
      });
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        merchant: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Save message to database
    const chat = await prisma.chat.create({
      data: {
        sessionId: parseInt(sessionId),
        merchantId: session.merchantId,
        message: JSON.stringify({
          role,
          content: message,
          timestamp: new Date().toISOString()
        })
      }
    });

    res.json({
      success: true,
      message: {
        id: chat.id,
        role,
        content: message,
        timestamp: chat.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save message'
    });
  }
});

/**
 * Get chat history for a session
 * GET /api/chat/sessions/:sessionId/messages
 */
router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await prisma.chat.findMany({
      where: { sessionId: parseInt(sessionId) },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const parsedMessages = messages.map(msg => {
      try {
        const parsed = JSON.parse(msg.message);
        return {
          id: msg.id,
          ...parsed,
          timestamp: msg.createdAt
        };
      } catch (e) {
        return {
          id: msg.id,
          role: 'user',
          content: msg.message,
          timestamp: msg.createdAt
        };
      }
    });

    res.json({
      success: true,
      messages: parsedMessages,
      count: parsedMessages.length
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

/**
 * Chat with MCP tools - Process user message and optionally execute tools
 * POST /api/chat/sessions/:sessionId/chat
 * 
 * Body: { 
 *   message: string,
 *   tools?: { name: string, args: object }[]
 * }
 */
router.post('/sessions/:sessionId/chat', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, tools } = req.body;

    // Verify session
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      include: { merchant: true }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Save user message
    await prisma.chat.create({
      data: {
        sessionId: parseInt(sessionId),
        merchantId: session.merchantId,
        message: JSON.stringify({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        })
      }
    });

    // Get conversation history for context
    const recentChats = await prisma.chat.findMany({
      where: { sessionId: parseInt(sessionId) },
      orderBy: { createdAt: 'asc' },
      take: 10 // Last 10 messages for context
    });

    const conversationHistory = recentChats.map(chat => {
      try {
        return JSON.parse(chat.message);
      } catch (e) {
        return { role: 'user', content: chat.message };
      }
    });

    // Chat with AI (Gemini/OpenAI) using MCP tools
    let assistantMessage;
    try {
      const aiResponse = await aiService.chat(
        session.merchantId,
        message,
        conversationHistory
      );

      assistantMessage = {
        role: 'assistant',
        content: aiResponse.response,
        functionCalls: aiResponse.functionCalls,
        toolResults: aiResponse.functionResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI error:', error);
      
      // Fallback response if AI fails
      assistantMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please configure your AI settings or try again.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }

    // Save assistant message
    await prisma.chat.create({
      data: {
        sessionId: parseInt(sessionId),
        merchantId: session.merchantId,
        message: JSON.stringify(assistantMessage)
      }
    });

    res.json({
      success: true,
      response: assistantMessage,
      mcpEndpoint: `/api/mcp/${session.merchantId}`,
      availableToolsEndpoint: `/api/mcp/${session.merchantId}/tools`
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({
      success: false,
      error: 'Chat processing failed'
    });
  }
});

/**
 * Get all sessions for a merchant
 * GET /api/chat/merchants/:merchantId/sessions
 */
router.get('/merchants/:merchantId/sessions', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const sessions = await prisma.session.findMany({
      where: { merchantId: parseInt(merchantId) },
      include: {
        _count: {
          select: { chats: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        merchantId: s.merchantId,
        createdAt: s.createdAt,
        messageCount: s._count.chats
      })),
      count: sessions.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

/**
 * Delete a session and all its messages
 * DELETE /api/chat/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    await prisma.session.delete({
      where: { id: parseInt(sessionId) }
    });

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete session'
    });
  }
});

module.exports = router;

