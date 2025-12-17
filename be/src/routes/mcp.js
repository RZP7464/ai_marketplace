const express = require('express');
const mcpService = require('../services/mcpService');
const mcpStreamService = require('../services/mcpStreamService');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * Get all available MCP servers (one per merchant)
 * GET /api/mcp/servers
 */
router.get('/servers', async (req, res) => {
  try {
    const servers = await mcpStreamService.getAllMCPServers();

    res.json({
      success: true,
      count: servers.length,
      servers
    });
  } catch (error) {
    console.error('Error listing MCP servers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate Cursor IDE MCP configuration for all merchants
 * GET /api/mcp/cursor-config
 */
router.get('/cursor-config', async (req, res) => {
  try {
    const merchants = await prisma.merchant.findMany({
      orderBy: { id: 'asc' },
      include: {
        apis: true
      }
    });

    const mcpServers = {};
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const wrapperPath = require('path').resolve(__dirname, '../../mcp-client-wrapper.js');
    
    for (const merchant of merchants) {
      // Only include merchants with APIs configured
      if (merchant.apis && merchant.apis.length > 0) {
        const serverName = merchant.slug.replace(/-/g, '_');
        mcpServers[serverName] = {
          command: "node",
          args: [
            wrapperPath,
            merchant.id.toString()
          ],
          env: {
            MERCHANT_ID: merchant.id.toString(),
            MERCHANT_NAME: merchant.name,
            MERCHANT_SLUG: merchant.slug,
            API_BASE_URL: baseUrl
          }
        };
      }
    }

    const config = {
      mcpServers
    };

    res.json({
      success: true,
      config,
      instructions: [
        "1. Copy the 'mcpServers' object from the config below",
        "2. Open Cursor IDE Settings (Cmd/Ctrl + ,)",
        "3. Search for 'mcp' in settings",
        "4. Click 'Edit in settings.json'",
        "5. Add or merge the mcpServers configuration",
        "6. Save and restart Cursor IDE",
        "7. Test by typing '@' in Cursor chat and selecting a merchant"
      ],
      merchantCount: Object.keys(mcpServers).length,
      baseUrl
    });
  } catch (error) {
    console.error('Error generating cursor config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * SSE Stream endpoint - Main MCP protocol endpoint
 * GET /api/mcp/merchants/:merchantId/stream
 * 
 * This is the primary endpoint for MCP clients to connect to
 * Uses Server-Sent Events for real-time communication
 */
router.get('/merchants/:merchantId/stream', async (req, res) => {
  const { merchantId } = req.params;

  try {
    // Validate merchant
    await mcpStreamService.validateMerchant(merchantId);

    // Initialize SSE stream
    const stream = mcpStreamService.initializeStream(res, merchantId);

    // Send server info
    const serverInfo = await mcpStreamService.handleInitialize(merchantId);
    stream.send('server-info', serverInfo);

    // Send tools list
    const toolsList = await mcpStreamService.handleToolsList(merchantId);
    stream.send('tools-list', toolsList);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      stream.send('heartbeat', { 
        timestamp: new Date().toISOString(),
        status: 'connected'
      });
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      stream.close();
      console.log(`MCP stream closed for merchant ${merchantId}`);
    });

  } catch (error) {
    console.error('MCP Stream Error:', error);
    res.status(500).json({
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
});

/**
 * List all available tools for a merchant
 * GET /api/mcp/merchants/:merchantId/tools
 * merchantId can be either numeric ID or slug
 */
router.get('/merchants/:merchantId/tools', async (req, res) => {
  let { merchantId } = req.params;

  try {
    // Check if merchantId is a slug (non-numeric)
    if (isNaN(parseInt(merchantId))) {
      const merchant = await prisma.merchant.findUnique({
        where: { slug: merchantId }
      });
      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: `Merchant with slug '${merchantId}' not found`
        });
      }
      merchantId = merchant.id;
    }

    const { merchant, tools } = await mcpService.getMerchantTools(merchantId);

    res.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug
      },
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      })),
      count: tools.length
    });
  } catch (error) {
    console.error('Error listing tools:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute a specific tool
 * POST /api/mcp/merchants/:merchantId/tools/:toolName
 * 
 * Body: {
 *   "args": { ...tool arguments... }
 * }
 */
router.post('/merchants/:merchantId/tools/:toolName', async (req, res) => {
  const { merchantId, toolName } = req.params;
  const { args } = req.body;

  try {
    const result = await mcpService.executeTool(merchantId, toolName, args || {});

    res.json({
      jsonrpc: '2.0',
      result: {
        success: result.success,
        data: result.data,
        status: result.status,
        error: result.error
      }
    });
  } catch (error) {
    console.error('Error executing tool:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message
      }
    });
  }
});

/**
 * Get MCP server info and metadata for a merchant
 * GET /api/mcp/merchants/:merchantId/info
 */
router.get('/merchants/:merchantId/info', async (req, res) => {
  const { merchantId } = req.params;

  try {
    const metadata = await mcpStreamService.getMCPServerMetadata(merchantId);

    res.json({
      success: true,
      ...metadata
    });
  } catch (error) {
    console.error('Error getting MCP info:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * MCP JSON-RPC endpoint (alternative to SSE)
 * POST /api/mcp/merchants/:merchantId/rpc
 * 
 * Handles JSON-RPC 2.0 requests for MCP protocol
 * Body: {
 *   "jsonrpc": "2.0",
 *   "method": "initialize|tools/list|tools/call",
 *   "params": {...},
 *   "id": 1
 * }
 */
router.post('/merchants/:merchantId/rpc', async (req, res) => {
  const { merchantId } = req.params;

  try {
    // Validate merchant
    await mcpStreamService.validateMerchant(merchantId);

    // Handle JSON-RPC request
    const result = await mcpStreamService.handleJsonRpcRequest(merchantId, req.body);

    res.json(result);
  } catch (error) {
    console.error('JSON-RPC Error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message
      },
      id: req.body.id
    });
  }
});

/**
 * Health check for MCP server
 * GET /api/mcp/health
 */
router.get('/health', async (req, res) => {
  try {
    const servers = await mcpStreamService.getAllMCPServers();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mcpServers: servers.length,
      protocol: 'MCP over HTTP-SSE',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
