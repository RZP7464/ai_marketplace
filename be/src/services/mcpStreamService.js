const prisma = require('../lib/prisma');
const mcpService = require('./mcpService');

/**
 * MCP Stream Service - Handles SSE-based MCP protocol
 * Provides streamable HTTP remote MCP for each merchant
 */
class MCPStreamService {
  /**
   * Initialize SSE stream for MCP server
   */
  initializeStream(res, merchantId) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial comment to establish connection
    res.write(': MCP Stream Connected\n\n');

    return {
      send: (event, data) => this.sendEvent(res, event, data),
      close: () => res.end()
    };
  }

  /**
   * Send SSE event
   */
  sendEvent(res, event, data) {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch (error) {
      console.error('Error sending SSE event:', error);
      return false;
    }
  }

  /**
   * Handle MCP initialization for a merchant
   */
  async handleInitialize(merchantId) {
    try {
      const { merchant, tools } = await mcpService.getMerchantTools(merchantId);

      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: true
          },
          prompts: {
            listChanged: false
          },
          resources: {
            subscribe: false,
            listChanged: false
          }
        },
        serverInfo: {
          name: `${merchant.name} MCP Server`,
          version: '1.0.0',
          vendor: 'AI Marketplace',
          description: `Dynamic MCP server for ${merchant.name}`,
          metadata: {
            merchantId: merchant.id,
            merchantSlug: merchant.slug,
            toolsCount: tools.length
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to initialize MCP: ${error.message}`);
    }
  }

  /**
   * Handle tools/list request
   */
  async handleToolsList(merchantId) {
    try {
      const { tools } = await mcpService.getMerchantTools(merchantId);

      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    } catch (error) {
      throw new Error(`Failed to list tools: ${error.message}`);
    }
  }

  /**
   * Handle tools/call request
   */
  async handleToolCall(merchantId, toolName, args) {
    try {
      const result = await mcpService.executeTool(merchantId, toolName, args);

      if (!result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool: ${result.error}`
            }
          ],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2)
          }
        ],
        isError: false
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Handle JSON-RPC request
   */
  async handleJsonRpcRequest(merchantId, request) {
    const { method, params, id } = request;

    try {
      let result;

      switch (method) {
        case 'initialize':
          result = await this.handleInitialize(merchantId);
          break;

        case 'tools/list':
          result = await this.handleToolsList(merchantId);
          break;

        case 'tools/call':
          result = await this.handleToolCall(
            merchantId,
            params.name,
            params.arguments || {}
          );
          break;

        case 'ping':
          result = { status: 'ok', timestamp: new Date().toISOString() };
          break;

        default:
          return {
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: `Method not found: ${method}`
            },
            id
          };
      }

      return {
        jsonrpc: '2.0',
        result,
        id
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message
        },
        id
      };
    }
  }

  /**
   * Create MCP server metadata
   */
  async getMCPServerMetadata(merchantId) {
    try {
      const { merchant, tools } = await mcpService.getMerchantTools(merchantId);

      return {
        type: 'mcp-server',
        protocol: 'http-sse',
        merchant: {
          id: merchant.id,
          name: merchant.name,
          slug: merchant.slug,
          displayName: merchant.displayName
        },
        endpoints: {
          stream: `/api/mcp/merchants/${merchantId}/stream`,
          rpc: `/api/mcp/merchants/${merchantId}/rpc`,
          tools: `/api/mcp/merchants/${merchantId}/tools`,
          info: `/api/mcp/merchants/${merchantId}/info`
        },
        capabilities: {
          tools: true,
          streaming: true,
          jsonRpc: true
        },
        tools: {
          count: tools.length,
          available: tools.map(t => t.name)
        },
        connectionInfo: {
          type: 'Server-Sent Events (SSE)',
          contentType: 'text/event-stream',
          keepAlive: true
        }
      };
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
  }

  /**
   * Get all available MCP servers (one per merchant)
   */
  async getAllMCPServers() {
    try {
      const merchants = await prisma.merchant.findMany({
        include: {
          _count: {
            select: { apis: true }
          }
        }
      });

      return merchants.map(merchant => ({
        merchantId: merchant.id,
        merchantName: merchant.name,
        merchantSlug: merchant.slug,
        displayName: merchant.displayName,
        apisCount: merchant._count.apis,
        mcpEndpoint: `/api/mcp/merchants/${merchant.id}/stream`,
        mcpUrl: `http://localhost:${process.env.PORT || 3001}/api/mcp/merchants/${merchant.id}/stream`
      }));
    } catch (error) {
      throw new Error(`Failed to list MCP servers: ${error.message}`);
    }
  }

  /**
   * Validate merchant has APIs configured
   */
  async validateMerchant(merchantId) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(merchantId) },
      include: {
        _count: {
          select: { apis: true }
        }
      }
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    if (merchant._count.apis === 0) {
      throw new Error('Merchant has no APIs configured');
    }

    return merchant;
  }
}

module.exports = new MCPStreamService();

