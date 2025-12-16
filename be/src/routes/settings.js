const express = require('express');
const prisma = require('../lib/prisma');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * Get merchant settings including MCP configuration
 * GET /api/settings/merchants/:merchantId
 */
router.get('/merchants/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const settings = await prisma.dynamicSettings.findUnique({
      where: { merchantId: parseInt(merchantId) },
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

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        success: true,
        settings: {
          merchantId: parseInt(merchantId),
          color: '#3B82F6',
          icon: null,
          header: null,
          footer: null,
          mcpEndpoint: `/api/mcp/${merchantId}`,
          geminiApiKey: process.env.GEMINI_API_KEY ? '***' : null
        }
      });
    }

    res.json({
      success: true,
      settings: {
        id: settings.id,
        merchantId: settings.merchantId,
        merchant: settings.merchant,
        color: settings.color,
        icon: settings.icon,
        header: settings.header,
        footer: settings.footer,
        mcpEndpoint: `/api/mcp/${merchantId}`,
        geminiApiKey: process.env.GEMINI_API_KEY ? '***' : null
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

/**
 * Update merchant settings
 * PUT /api/settings/merchants/:merchantId
 */
router.put('/merchants/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { color, icon, header, footer } = req.body;

    const settings = await prisma.dynamicSettings.upsert({
      where: { merchantId: parseInt(merchantId) },
      update: {
        color,
        icon,
        header,
        footer
      },
      create: {
        merchantId: parseInt(merchantId),
        color: color || '#3B82F6',
        icon,
        header,
        footer
      }
    });

    res.json({
      success: true,
      settings: {
        id: settings.id,
        merchantId: settings.merchantId,
        color: settings.color,
        icon: settings.icon,
        header: settings.header,
        footer: settings.footer
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

/**
 * Get MCP configuration
 * GET /api/settings/merchants/:merchantId/mcp
 */
router.get('/merchants/:merchantId/mcp', async (req, res) => {
  try {
    const { merchantId } = req.params;

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(merchantId) },
      include: {
        _count: {
          select: { apis: true }
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
      mcp: {
        endpoint: `/api/mcp/${merchantId}`,
        fullUrl: `${req.protocol}://${req.get('host')}/api/mcp/${merchantId}`,
        toolsEndpoint: `/api/mcp/${merchantId}/tools`,
        rpcEndpoint: `/api/mcp/${merchantId}/rpc`,
        infoEndpoint: `/api/mcp/${merchantId}/info`,
        merchant: {
          id: merchant.id,
          name: merchant.name,
          slug: merchant.slug
        },
        toolsCount: merchant._count.apis,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error fetching MCP config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MCP configuration'
    });
  }
});

/**
 * Get available AI providers and models
 * GET /api/settings/ai/providers
 */
router.get('/ai/providers', async (req, res) => {
  try {
    const providers = aiService.getAvailableProviders();
    res.json({
      success: true,
      providers
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI providers'
    });
  }
});

/**
 * Get AI configurations for a merchant
 * GET /api/settings/merchants/:merchantId/ai
 */
router.get('/merchants/:merchantId/ai', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const configurations = await prisma.aiConfiguration.findMany({
      where: { merchantId: parseInt(merchantId) },
      orderBy: { createdAt: 'desc' }
    });

    // Mask API keys for security
    const maskedConfigs = configurations.map(config => ({
      ...config,
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}` : null
    }));

    res.json({
      success: true,
      configurations: maskedConfigs
    });
  } catch (error) {
    console.error('Error fetching AI configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI configurations'
    });
  }
});

/**
 * Create or update AI configuration
 * POST /api/settings/merchants/:merchantId/ai
 */
router.post('/merchants/:merchantId/ai', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { provider, apiKey, model, config } = req.body;

    if (!provider || !apiKey || !model) {
      return res.status(400).json({
        success: false,
        error: 'Provider, apiKey, and model are required'
      });
    }

    // Test API key before saving
    const testResult = await aiService.testApiKey(provider, apiKey, model);
    
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        error: `API key validation failed: ${testResult.message}`
      });
    }

    // Deactivate other configs of same provider
    await prisma.aiConfiguration.updateMany({
      where: {
        merchantId: parseInt(merchantId),
        provider
      },
      data: { isActive: false }
    });

    // Create or update configuration
    const aiConfig = await prisma.aiConfiguration.upsert({
      where: {
        merchantId_provider: {
          merchantId: parseInt(merchantId),
          provider
        }
      },
      update: {
        apiKey,
        model,
        config,
        isActive: true
      },
      create: {
        merchantId: parseInt(merchantId),
        provider,
        apiKey,
        model,
        config,
        isActive: true
      }
    });

    // Mask API key in response
    const maskedConfig = {
      ...aiConfig,
      apiKey: `${aiConfig.apiKey.substring(0, 8)}...${aiConfig.apiKey.substring(aiConfig.apiKey.length - 4)}`
    };

    res.json({
      success: true,
      configuration: maskedConfig,
      testResult
    });
  } catch (error) {
    console.error('Error saving AI config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save AI configuration'
    });
  }
});

/**
 * Test AI API key
 * POST /api/settings/ai/test
 */
router.post('/ai/test', async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;

    if (!provider || !apiKey || !model) {
      return res.status(400).json({
        success: false,
        error: 'Provider, apiKey, and model are required'
      });
    }

    const result = await aiService.testApiKey(provider, apiKey, model);
    res.json(result);
  } catch (error) {
    console.error('Error testing API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test API key'
    });
  }
});

/**
 * Set active AI provider for merchant
 * PUT /api/settings/merchants/:merchantId/ai/:configId/activate
 */
router.put('/merchants/:merchantId/ai/:configId/activate', async (req, res) => {
  try {
    const { merchantId, configId } = req.params;

    const config = await prisma.aiConfiguration.findUnique({
      where: { id: parseInt(configId) }
    });

    if (!config || config.merchantId !== parseInt(merchantId)) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    // Deactivate all configs for this merchant
    await prisma.aiConfiguration.updateMany({
      where: { merchantId: parseInt(merchantId) },
      data: { isActive: false }
    });

    // Activate this config
    const updatedConfig = await prisma.aiConfiguration.update({
      where: { id: parseInt(configId) },
      data: { isActive: true }
    });

    res.json({
      success: true,
      configuration: {
        ...updatedConfig,
        apiKey: `${updatedConfig.apiKey.substring(0, 8)}...${updatedConfig.apiKey.substring(updatedConfig.apiKey.length - 4)}`
      }
    });
  } catch (error) {
    console.error('Error activating AI config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate AI configuration'
    });
  }
});

/**
 * Delete AI configuration
 * DELETE /api/settings/merchants/:merchantId/ai/:configId
 */
router.delete('/merchants/:merchantId/ai/:configId', async (req, res) => {
  try {
    const { merchantId, configId } = req.params;

    const config = await prisma.aiConfiguration.findUnique({
      where: { id: parseInt(configId) }
    });

    if (!config || config.merchantId !== parseInt(merchantId)) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    await prisma.aiConfiguration.delete({
      where: { id: parseInt(configId) }
    });

    res.json({
      success: true,
      message: 'AI configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting AI config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete AI configuration'
    });
  }
});

module.exports = router;

