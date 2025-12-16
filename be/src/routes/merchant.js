const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/merchant - Get current merchant profile
router.get("/", authenticateToken, async (req, res) => {
  try {
    const merchantId = req.user.merchantId;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        dynamicSettings: true,
      },
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: "Merchant not found",
      });
    }

    res.json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    console.error("Get merchant error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// PUT /api/merchant/brand - Update brand identity (Step 1 of signup)
router.put("/brand", authenticateToken, async (req, res) => {
  try {
    const merchantId = req.user.merchantId;
    const {
      displayName,
      logo,
      tagline,
      welcomeMessage,
      categories,
      primaryColor,
      secondaryColor,
      accentColor,
    } = req.body;

    // Update merchant brand fields
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        displayName,
        logo,
        tagline,
        welcomeMessage,
        categories,
      },
    });

    // Upsert dynamic settings for colors
    const dynamicSettings = await prisma.dynamicSettings.upsert({
      where: { merchantId },
      create: {
        merchantId,
        primaryColor,
        secondaryColor,
        accentColor,
      },
      update: {
        primaryColor,
        secondaryColor,
        accentColor,
      },
    });

    res.json({
      success: true,
      data: {
        merchant,
        dynamicSettings,
      },
    });
  } catch (error) {
    console.error("Update brand error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// PUT /api/merchant/settings - Update dynamic settings (UI customization)
router.put("/settings", authenticateToken, async (req, res) => {
  try {
    const merchantId = req.user.merchantId;
    const {
      color,
      icon,
      header,
      footer,
      primaryColor,
      secondaryColor,
      accentColor,
    } = req.body;

    const dynamicSettings = await prisma.dynamicSettings.upsert({
      where: { merchantId },
      create: {
        merchantId,
        color,
        icon,
        header,
        footer,
        primaryColor,
        secondaryColor,
        accentColor,
      },
      update: {
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(header !== undefined && { header }),
        ...(footer !== undefined && { footer }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(secondaryColor !== undefined && { secondaryColor }),
        ...(accentColor !== undefined && { accentColor }),
      },
    });

    res.json({
      success: true,
      data: dynamicSettings,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/merchant/complete-setup - Complete merchant signup/onboarding
// Creates new merchant with brand data and API configs (no auth required)
router.post("/complete-setup", async (req, res) => {
  try {
    const { brandData, apiConfigs, email, password, name } = req.body;
    
    // Validate required fields
    if (!brandData || !brandData.display_name) {
      return res.status(400).json({
        success: false,
        error: 'Brand name is required'
      });
    }
    
    // Generate unique email and slug if not provided
    const merchantEmail = email || `${brandData.display_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@merchant.local`;
    const merchantSlug = brandData.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const merchantPassword = password || 'password123';
    const merchantName = name || `${brandData.display_name} Admin`;
    
    // Check if merchant with this slug already exists
    const existingMerchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug }
    });
    
    let finalMerchantId;
    
    if (existingMerchant) {
      // Update existing merchant
      finalMerchantId = existingMerchant.id;
    } else {
      // Create new merchant
      const newMerchant = await prisma.merchant.create({
        data: {
          name: brandData.display_name,
          email: merchantEmail,
          slug: merchantSlug,
          type: 'general',
          displayName: brandData.display_name
        }
      });
      finalMerchantId = newMerchant.id;
      
      // Create default user for this merchant
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(merchantPassword, 10);
      
      await prisma.user.create({
        data: {
          name: merchantName,
          email: merchantEmail,
          password: hashedPassword,
          merchantId: finalMerchantId
        }
      });
    }

    // Start a transaction to update everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update merchant brand data
      const merchant = await tx.merchant.update({
        where: { id: finalMerchantId },
        data: {
          displayName: brandData.display_name,
          logo: typeof brandData.display_logo === 'string' ? brandData.display_logo : null,
          tagline: brandData.display_tagline,
          welcomeMessage: brandData.display_message,
          categories: brandData.display_category,
        },
      });

      // 2. Upsert dynamic settings for colors
      const dynamicSettings = await tx.dynamicSettings.upsert({
        where: { merchantId: finalMerchantId },
        create: {
          merchantId: finalMerchantId,
          primaryColor: brandData.primary_color,
          secondaryColor: brandData.secondary_color,
          accentColor: brandData.accent_color,
        },
        update: {
          primaryColor: brandData.primary_color,
          secondaryColor: brandData.secondary_color,
          accentColor: brandData.accent_color,
        },
      });

      // 3. Create or get default credential for APIs
      let credential = await tx.credential.findFirst({
        where: { merchantId: finalMerchantId },
      });

      if (!credential) {
        credential = await tx.credential.create({
          data: {
            merchantId: finalMerchantId,
            authType: "none",
          },
        });
      }

      // 4. Process API configurations
      const apiTypeMapping = {
        search_item: "search",
        add_to_cart: "addtocart",
        checkout: "checkout",
        base_prompt: "basesystemprompt",
        coupons: "coupons",
      };

      const savedApis = [];

      for (const [apiKey, config] of Object.entries(apiConfigs)) {
        const apiType = apiTypeMapping[apiKey] || apiKey;

        // Build payload and config from the form data
        const payload = {
          name: apiType, // Tool name for MCP
          description: `${apiType.charAt(0).toUpperCase() + apiType.slice(1)} functionality`,
          url: config.url,
          method: config.method,
          headers: config.headers.filter((h) => h.key && h.value),
          params: config.params.filter((p) => p.key && p.value),
          body: config.body,
        };

        const apiConfig = {
          timeout: 30000,
          retries: 3,
        };

        // Upsert API configuration
        const existingApi = await tx.api.findFirst({
          where: { merchantId: finalMerchantId, apiType },
        });

        let savedApi;
        if (existingApi) {
          savedApi = await tx.api.update({
            where: { id: existingApi.id },
            data: {
              payload,
              config: apiConfig,
              authId: credential.id,
            },
          });
        } else {
          savedApi = await tx.api.create({
            data: {
              apiType,
              payload,
              config: apiConfig,
              merchantId: finalMerchantId,
              authId: credential.id,
            },
          });
        }

        savedApis.push(savedApi);
      }

      return { merchant, dynamicSettings, apis: savedApis };
    });

    res.json({
      success: true,
      data: result,
      message: "Setup completed successfully",
    });
  } catch (error) {
    console.error("Complete setup error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/merchant/upload-logo - Upload logo (placeholder - needs file upload setup)
router.post("/upload-logo", authenticateToken, async (req, res) => {
  try {
    // For now, accept base64 or URL
    const { logoUrl, logoBase64 } = req.body;
    const merchantId = req.user.merchantId;

    let finalLogoUrl = logoUrl;

    // If base64 is provided, you would upload to a storage service
    // For now, we'll just store the URL or base64
    if (logoBase64) {
      // In production, upload to S3/CloudStorage and get URL
      finalLogoUrl = logoBase64; // Storing base64 temporarily
    }

    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: { logo: finalLogoUrl },
    });

    res.json({
      success: true,
      data: { logoUrl: merchant.logo },
    });
  } catch (error) {
    console.error("Upload logo error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;

