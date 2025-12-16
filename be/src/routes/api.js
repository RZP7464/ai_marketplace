const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Valid API types
const API_TYPES = [
  "search",
  "addtocart",
  "checkout",
  "coupons",
  "basesystemprompt",
];

// POST /api/merchant-apis - Create a new API configuration
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { apiType, payload, config, authId } = req.body;
    const merchantId = req.user.merchantId;

    // Validate input
    if (!apiType || !payload || !config || !authId) {
      return res.status(400).json({
        success: false,
        error: "apiType, payload, config, and authId are required",
      });
    }

    // Validate apiType
    const normalizedApiType = apiType.toLowerCase().replace(/[_\s]/g, "");
    if (!API_TYPES.includes(normalizedApiType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid apiType. Must be one of: ${API_TYPES.join(", ")}`,
      });
    }

    // Check if credential exists and belongs to the merchant
    const credential = await prisma.credential.findFirst({
      where: {
        id: authId,
        merchantId: merchantId,
      },
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: "Credential not found or does not belong to this merchant",
      });
    }

    // Check if API of this type already exists for this merchant
    const existingApi = await prisma.api.findFirst({
      where: {
        merchantId: merchantId,
        apiType: normalizedApiType,
      },
    });

    if (existingApi) {
      return res.status(409).json({
        success: false,
        error: `API configuration for '${normalizedApiType}' already exists. Use PUT to update.`,
      });
    }

    // Create API configuration
    const api = await prisma.api.create({
      data: {
        apiType: normalizedApiType,
        payload,
        config,
        merchantId,
        authId,
      },
      include: {
        credential: {
          select: {
            id: true,
            authType: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: api,
    });
  } catch (error) {
    console.error("Create API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/merchant-apis - Get all API configurations for the merchant
router.get("/", authenticateToken, async (req, res) => {
  try {
    const merchantId = req.user.merchantId;

    const apis = await prisma.api.findMany({
      where: { merchantId },
      include: {
        credential: {
          select: {
            id: true,
            authType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: apis,
    });
  } catch (error) {
    console.error("Get APIs error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/merchant-apis/:apiType - Get specific API configuration by type
router.get("/:apiType", authenticateToken, async (req, res) => {
  try {
    const merchantId = req.user.merchantId;
    const normalizedApiType = req.params.apiType.toLowerCase().replace(/[_\s]/g, "");

    if (!API_TYPES.includes(normalizedApiType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid apiType. Must be one of: ${API_TYPES.join(", ")}`,
      });
    }

    const api = await prisma.api.findFirst({
      where: {
        merchantId,
        apiType: normalizedApiType,
      },
      include: {
        credential: {
          select: {
            id: true,
            authType: true,
          },
        },
      },
    });

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `API configuration for '${normalizedApiType}' not found`,
      });
    }

    res.json({
      success: true,
      data: api,
    });
  } catch (error) {
    console.error("Get API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// PUT /api/merchant-apis/:apiType - Update API configuration by type
router.put("/:apiType", authenticateToken, async (req, res) => {
  try {
    const merchantId = req.user.merchantId;
    const normalizedApiType = req.params.apiType.toLowerCase().replace(/[_\s]/g, "");
    const { payload, config, authId } = req.body;

    if (!API_TYPES.includes(normalizedApiType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid apiType. Must be one of: ${API_TYPES.join(", ")}`,
      });
    }

    // Find existing API
    const existingApi = await prisma.api.findFirst({
      where: {
        merchantId,
        apiType: normalizedApiType,
      },
    });

    if (!existingApi) {
      return res.status(404).json({
        success: false,
        error: `API configuration for '${normalizedApiType}' not found`,
      });
    }

    // If authId is being updated, validate it
    if (authId && authId !== existingApi.authId) {
      const credential = await prisma.credential.findFirst({
        where: {
          id: authId,
          merchantId: merchantId,
        },
      });

      if (!credential) {
        return res.status(404).json({
          success: false,
          error: "Credential not found or does not belong to this merchant",
        });
      }
    }

    // Update API configuration
    const api = await prisma.api.update({
      where: { id: existingApi.id },
      data: {
        ...(payload && { payload }),
        ...(config && { config }),
        ...(authId && { authId }),
      },
      include: {
        credential: {
          select: {
            id: true,
            authType: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: api,
    });
  } catch (error) {
    console.error("Update API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// DELETE /api/merchant-apis/:apiType - Delete API configuration by type
router.delete("/:apiType", authenticateToken, async (req, res) => {
  try {
    const merchantId = req.user.merchantId;
    const normalizedApiType = req.params.apiType.toLowerCase().replace(/[_\s]/g, "");

    if (!API_TYPES.includes(normalizedApiType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid apiType. Must be one of: ${API_TYPES.join(", ")}`,
      });
    }

    // Find existing API
    const existingApi = await prisma.api.findFirst({
      where: {
        merchantId,
        apiType: normalizedApiType,
      },
    });

    if (!existingApi) {
      return res.status(404).json({
        success: false,
        error: `API configuration for '${normalizedApiType}' not found`,
      });
    }

    await prisma.api.delete({
      where: { id: existingApi.id },
    });

    res.json({
      success: true,
      message: `API configuration for '${normalizedApiType}' deleted successfully`,
    });
  } catch (error) {
    console.error("Delete API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/merchant-apis/bulk - Create or update multiple API configurations at once
router.post("/bulk", authenticateToken, async (req, res) => {
  try {
    const merchantId = req.user.merchantId;
    const { apis } = req.body;

    if (!apis || !Array.isArray(apis) || apis.length === 0) {
      return res.status(400).json({
        success: false,
        error: "apis array is required and must not be empty",
      });
    }

    const results = [];
    const errors = [];

    for (const apiData of apis) {
      const { apiType, payload, config, authId } = apiData;

      // Validate each API entry
      if (!apiType || !payload || !config || !authId) {
        errors.push({
          apiType: apiType || "unknown",
          error: "apiType, payload, config, and authId are required",
        });
        continue;
      }

      const normalizedApiType = apiType.toLowerCase().replace(/[_\s]/g, "");
      if (!API_TYPES.includes(normalizedApiType)) {
        errors.push({
          apiType,
          error: `Invalid apiType. Must be one of: ${API_TYPES.join(", ")}`,
        });
        continue;
      }

      // Check if credential exists
      const credential = await prisma.credential.findFirst({
        where: {
          id: authId,
          merchantId: merchantId,
        },
      });

      if (!credential) {
        errors.push({
          apiType: normalizedApiType,
          error: "Credential not found or does not belong to this merchant",
        });
        continue;
      }

      // Upsert API configuration
      const api = await prisma.api.upsert({
        where: {
          id: (await prisma.api.findFirst({
            where: { merchantId, apiType: normalizedApiType },
          }))?.id || 0,
        },
        create: {
          apiType: normalizedApiType,
          payload,
          config,
          merchantId,
          authId,
        },
        update: {
          payload,
          config,
          authId,
        },
        include: {
          credential: {
            select: {
              id: true,
              authType: true,
            },
          },
        },
      });

      results.push(api);
    }

    res.status(errors.length > 0 ? 207 : 201).json({
      success: errors.length === 0,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk create API error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;

