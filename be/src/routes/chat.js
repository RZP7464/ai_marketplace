const express = require('express');
const prisma = require('../lib/prisma');
const mcpService = require('../services/mcpService');
const aiService = require('../services/aiService');

const router = express.Router();

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

