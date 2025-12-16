const express = require('express');
const mcpService = require('../services/mcpService');

const router = express.Router();

/**
 * MCP Server endpoint for a specific merchant
 * GET /api/mcp/merchants/:merchantId
 * 
 * This endpoint implements the Model Context Protocol (MCP)
 * It exposes all merchant's APIs as callable tools
 */
router.get('/merchants/:merchantId', async (req, res) => {
  const { merchantId } = req.params;

  try {
    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Get merchant tools
    const { merchant, tools } = await mcpService.getMerchantTools(merchantId);

    // Send initial MCP server info
    const serverInfo = {
      jsonrpc: '2.0',
      method: 'server/info',
      params: {
        name: `${merchant.name} MCP Server`,
        version: '1.0.0',
        description: `Dynamic MCP server for ${merchant.name} with ${tools.length} tools`,
        merchant: {
          id: merchant.id,
          name: merchant.name,
          slug: merchant.slug
        },
        capabilities: {
          tools: true,
          resources: false,
          prompts: false
        }
      }
    };

    res.write(`data: ${JSON.stringify(serverInfo)}\n\n`);

    // Send tools list
    const toolsList = {
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      }
    };

    res.write(`data: ${JSON.stringify(toolsList)}\n\n`);

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      res.end();
    });

  } catch (error) {
    console.error('MCP Server Error:', error);
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
 * List all available tools for a merchant
 * GET /api/mcp/merchants/:merchantId/tools
 */
router.get('/merchants/:merchantId/tools', async (req, res) => {
  const { merchantId } = req.params;

  try {
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
 * Get MCP server info for a merchant
 * GET /api/mcp/merchants/:merchantId/info
 */
router.get('/merchants/:merchantId/info', async (req, res) => {
  const { merchantId } = req.params;

  try {
    const { merchant, tools } = await mcpService.getMerchantTools(merchantId);

    res.json({
      success: true,
      server: {
        name: `${merchant.name} MCP Server`,
        version: '1.0.0',
        merchant: {
          id: merchant.id,
          name: merchant.name,
          slug: merchant.slug
        },
        capabilities: {
          tools: true,
          resources: false,
          prompts: false
        },
        toolsCount: tools.length,
        endpoint: `/api/mcp/merchants/${merchantId}`,
        toolsEndpoint: `/api/mcp/merchants/${merchantId}/tools`,
        executeEndpoint: `/api/mcp/merchants/${merchantId}/tools/:toolName`
      }
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
 */
router.post('/merchants/:merchantId/rpc', async (req, res) => {
  const { merchantId } = req.params;
  const { method, params, id } = req.body;

  try {
    let result;

    switch (method) {
      case 'server/info': {
        const { merchant, tools } = await mcpService.getMerchantTools(merchantId);
        result = {
          name: `${merchant.name} MCP Server`,
          version: '1.0.0',
          merchant,
          capabilities: {
            tools: true,
            resources: false,
            prompts: false
          },
          toolsCount: tools.length
        };
        break;
      }

      case 'tools/list': {
        const { tools } = await mcpService.getMerchantTools(merchantId);
        result = {
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        };
        break;
      }

      case 'tools/call': {
        const { name: toolName, arguments: args } = params;
        result = await mcpService.executeTool(merchantId, toolName, args);
        break;
      }

      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          },
          id
        });
    }

    res.json({
      jsonrpc: '2.0',
      result,
      id
    });

  } catch (error) {
    console.error('JSON-RPC Error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message
      },
      id
    });
  }
});

module.exports = router;

