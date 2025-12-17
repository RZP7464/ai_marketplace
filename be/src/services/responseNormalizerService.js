const { GoogleGenerativeAI } = require("@google/generative-ai");
const prisma = require("../lib/prisma");

/**
 * AI-Powered Response Normalizer Service
 *
 * Uses the merchant's configured AI (from aiConfigurations table) to understand
 * ANY API response format and normalize it into a consistent structure.
 */
class ResponseNormalizerService {
  constructor() {
    // Cache AI clients per merchant to avoid recreating
    this.aiClients = new Map();
  }

  /**
   * Get AI model for a merchant from their configuration
   */
  async getModelForMerchant(merchantId) {
    // Check cache first
    if (this.aiClients.has(merchantId)) {
      return this.aiClients.get(merchantId);
    }

    // Fetch merchant's AI configuration from database
    const aiConfig = await prisma.aiConfiguration.findFirst({
      where: {
        merchantId: parseInt(merchantId),
        isActive: true,
      },
    });

    if (!aiConfig) {
      // Fallback to environment variables if no config
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn(
          `No AI config for merchant ${merchantId} and no GEMINI_API_KEY set`
        );
        return null;
      }

      console.log(`Using default Gemini config for merchant ${merchantId}`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      });

      this.aiClients.set(merchantId, model);
      return model;
    }

    // Use merchant's configured AI
    console.log(
      `Using merchant ${merchantId} AI config: ${aiConfig.provider}/${aiConfig.model}`
    );

    if (aiConfig.provider === "gemini") {
      const genAI = new GoogleGenerativeAI(aiConfig.apiKey);
      const model = genAI.getGenerativeModel({
        model: aiConfig.model,
        generationConfig: {
          temperature: aiConfig.config?.temperature || 0.1,
          maxOutputTokens: aiConfig.config?.maxOutputTokens || 4096,
        },
      });

      this.aiClients.set(merchantId, model);
      return model;
    }

    // For non-Gemini providers, return null (will use basic normalization)
    console.warn(
      `AI normalization not supported for provider: ${aiConfig.provider}`
    );
    return null;
  }

  /**
   * Clear cached AI client for a merchant (call when config changes)
   */
  clearCache(merchantId) {
    this.aiClients.delete(merchantId);
  }

  /**
   * Main entry point: Normalize any tool result using AI
   * @param {string} toolName - Name of the tool that produced the result
   * @param {object} rawResult - Raw API response
   * @param {object} merchantContext - Must include merchantId
   */
  async normalizeToolResult(toolName, rawResult, merchantContext = {}) {
    console.log(`\n=== AI Normalizing Result for Tool: ${toolName} ===`);

    if (!rawResult || (!rawResult.data && !rawResult.success)) {
      return { products: [], summary: "No data received", raw: rawResult };
    }

    const data = rawResult.data || rawResult;
    const merchantId = merchantContext.merchantId;

    if (!merchantId) {
      console.warn("No merchantId provided, using basic normalization");
      return this.basicNormalization(data);
    }

    try {
      // Use merchant's AI config to normalize the response
      const normalized = await this.normalizeWithAI(
        toolName,
        data,
        merchantId,
        merchantContext
      );
      console.log(
        `✅ AI Normalized ${normalized.products?.length || 0} products`
      );

      // If AI returned no products, fall back to basic normalization
      // (AI might have parsed truncated data missing the products array)
      if (!normalized.products || normalized.products.length === 0) {
        console.log("AI returned no products, trying basic normalization...");
        const basicResult = this.basicNormalization(data);
        if (basicResult.products.length > 0) {
          console.log(
            `✅ Basic normalization found ${basicResult.products.length} products`
          );
          return basicResult;
        }
      }

      return normalized;
    } catch (error) {
      console.error("AI normalization failed:", error.message);
      // Fallback to basic extraction
      return this.basicNormalization(data);
    }
  }

  /**
   * Use merchant's configured AI to parse and normalize any API response
   */
  async normalizeWithAI(toolName, data, merchantId, merchantContext) {
    const model = await this.getModelForMerchant(merchantId);

    if (!model) {
      console.log(
        "No AI model available for merchant, using basic normalization"
      );
      return this.basicNormalization(data);
    }

    // Truncate large responses to avoid token limits
    const dataStr = JSON.stringify(data, null, 2);
    const truncatedData =
      dataStr.length > 15000
        ? dataStr.substring(0, 15000) + "...(truncated)"
        : dataStr;

    const prompt = `You are a data parser. Analyze this API response and extract product/item information into a clean, consistent format.

TOOL NAME: ${toolName}
MERCHANT CONTEXT: ${JSON.stringify(merchantContext)}

API RESPONSE:
\`\`\`json
${truncatedData}
\`\`\`

YOUR TASK:
1. Identify all products/items in the response (could be nested anywhere)
2. Extract key information for each: name, price, image, description, url, brand, category
3. Normalize prices to simple numbers (e.g., if price is {current:{min:500}}, extract 500)
4. Find the best image URL for each product
5. Generate a brief summary of what was found

RESPOND WITH ONLY THIS JSON FORMAT (no markdown, no explanation):
{
  "products": [
    {
      "id": "unique-id-or-index",
      "name": "Product Name",
      "price": 599,
      "originalPrice": 799,
      "currency": "₹",
      "discount": "25% off",
      "image": "https://full-image-url.jpg",
      "description": "Brief product description",
      "brand": "Brand Name",
      "category": "Category",
      "url": "https://product-page-url",
      "rating": 4.5,
      "inStock": true
    }
  ],
  "totalCount": 100,
  "summary": "Found 12 beauty products including lipsticks and shampoos, prices range from ₹250 to ₹500"
}

RULES:
- If a field is not available, omit it (don't use null)
- Prices must be numbers, not strings or objects
- Images must be full URLs
- Summary should be 1-2 sentences, helpful for chat display
- Maximum 12 products in the response
- If no products found, return empty products array with appropriate summary`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText;
      if (jsonText.includes("```")) {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        jsonText = match ? match[1].trim() : jsonText;
      }

      // Parse and validate
      const parsed = JSON.parse(jsonText);

      // Validate structure
      if (!parsed.products) {
        parsed.products = [];
      }

      if (!Array.isArray(parsed.products)) {
        parsed.products = [parsed.products];
      }

      // Clean up each product
      parsed.products = parsed.products
        .map((p, idx) => ({
          id: p.id || `product-${idx}`,
          name: p.name || "Unknown Product",
          price:
            typeof p.price === "number" ? p.price : this.extractNumber(p.price),
          originalPrice:
            typeof p.originalPrice === "number"
              ? p.originalPrice
              : this.extractNumber(p.originalPrice),
          currency: p.currency || "₹",
          discount: p.discount,
          image: p.image,
          description: p.description,
          brand: p.brand,
          category: p.category,
          url: p.url,
          rating: p.rating,
          inStock: p.inStock,
        }))
        .filter((p) => p.name && p.name !== "Unknown Product");

      return {
        products: parsed.products,
        totalCount: parsed.totalCount || parsed.products.length,
        summary: parsed.summary || `Found ${parsed.products.length} items`,
        normalized: true,
      };
    } catch (error) {
      console.error("AI parsing error:", error.message);
      throw error;
    }
  }

  /**
   * Basic normalization fallback when AI is unavailable
   * Enhanced to handle common e-commerce API structures like Tira, Shopify, etc.
   */
  basicNormalization(data) {
    const products = [];

    // Try to find products array
    const findProducts = (obj, depth = 0) => {
      if (depth > 5 || !obj) return;

      if (Array.isArray(obj)) {
        obj.forEach((item) => {
          if (
            item &&
            typeof item === "object" &&
            (item.name || item.title || item.product_name)
          ) {
            products.push(this.extractProductBasic(item));
          } else {
            findProducts(item, depth + 1);
          }
        });
      } else if (typeof obj === "object") {
        // Check common array field names (order matters - items is common in Tira)
        const arrayFields = [
          "items",
          "products",
          "results",
          "data",
          "list",
          "records",
          "hits",
        ];
        for (const field of arrayFields) {
          if (Array.isArray(obj[field])) {
            findProducts(obj[field], depth + 1);
            return;
          }
        }

        // Check if this object itself is a product
        if (obj.name || obj.title || obj.product_name) {
          products.push(this.extractProductBasic(obj));
        }
      }
    };

    findProducts(data);

    // Get total count if available
    const totalCount =
      data?.page?.item_total ||
      data?.total ||
      data?.totalCount ||
      products.length;

    return {
      products: products.slice(0, 12),
      totalCount,
      summary:
        products.length > 0
          ? `Found ${totalCount} item${totalCount > 1 ? "s" : ""}`
          : "No products found in response",
      normalized: true,
    };
  }

  /**
   * Extract product data using basic field mapping
   * Enhanced to handle Tira, Shopify, and common e-commerce structures
   */
  extractProductBasic(item) {
    // Extract brand (could be object or string)
    let brandName = null;
    if (typeof item.brand === "object" && item.brand?.name) {
      brandName = item.brand.name;
    } else if (typeof item.brand === "string") {
      brandName = item.brand;
    } else if (item.brand_name) {
      brandName = item.brand_name;
    }

    // Extract category
    let category = null;
    if (
      item.categories &&
      Array.isArray(item.categories) &&
      item.categories[0]
    ) {
      const cat = item.categories[0];
      category = typeof cat === "object" ? cat.name : cat;
    } else if (item.category) {
      category =
        typeof item.category === "object" ? item.category.name : item.category;
    }

    return {
      id:
        item.id ||
        item._id ||
        item.product_id ||
        item.uid ||
        Math.random().toString(36).substr(2, 9),
      name:
        item.name ||
        item.title ||
        item.product_name ||
        item.productName ||
        "Unknown",
      price: this.extractPriceBasic(item),
      originalPrice: this.extractOriginalPrice(item),
      currency:
        item.price?.current?.currency_symbol ||
        item.price?.currency_symbol ||
        "₹",
      discount: this.extractDiscount(item),
      image: this.extractImageBasic(item),
      description:
        item.description ||
        item.desc ||
        item.short_description ||
        item.summary ||
        item.teaser,
      brand: brandName,
      category: category,
      url: item.url || item.link || item.product_url || item.slug,
      rating: item.rating || item.ratings?.average || item.rating_average,
      inStock:
        item.sellable !== undefined
          ? item.sellable
          : item.in_stock !== undefined
          ? item.in_stock
          : true,
    };
  }

  /**
   * Extract price from various formats
   * Handles: Tira ({effective, marked}), Shopify, and common e-commerce formats
   */
  extractPriceBasic(item) {
    if (item.price && typeof item.price === "object") {
      const priceObj = item.price;

      // Tira format: {effective: {min: 500}, marked: {...}} - effective is current price
      if (priceObj.effective && typeof priceObj.effective === "object") {
        const eff = priceObj.effective;
        if (eff.min !== undefined)
          return typeof eff.min === "number" ? eff.min : parseFloat(eff.min);
        if (eff.max !== undefined)
          return typeof eff.max === "number" ? eff.max : parseFloat(eff.max);
      }

      // Other format: {current: {min: 500, max: 500}, original: {...}}
      if (priceObj.current && typeof priceObj.current === "object") {
        const current = priceObj.current;
        if (current.min !== undefined)
          return typeof current.min === "number"
            ? current.min
            : parseFloat(current.min);
        if (current.max !== undefined)
          return typeof current.max === "number"
            ? current.max
            : parseFloat(current.max);
      }

      // Direct price object: {min: 500, max: 500} (no wrapper)
      if (priceObj.min !== undefined)
        return typeof priceObj.min === "number"
          ? priceObj.min
          : parseFloat(priceObj.min);
      if (priceObj.max !== undefined)
        return typeof priceObj.max === "number"
          ? priceObj.max
          : parseFloat(priceObj.max);

      // Simple values: {effective: 500}, {final: 500}, etc
      const directFields = [
        "effective",
        "final",
        "discounted",
        "sale",
        "value",
        "amount",
        "selling",
      ];
      for (const field of directFields) {
        const val = priceObj[field];
        if (typeof val === "number") return val;
        if (typeof val === "string") return parseFloat(val);
      }
    }

    // Check direct price fields on item
    const priceFields = ["selling_price", "effective_price", "cost", "amount"];
    for (const field of priceFields) {
      const val = item[field];
      if (typeof val === "number") return val;
      if (typeof val === "string") return parseFloat(val);
    }

    return null;
  }

  /**
   * Extract price value from complex structures
   */
  extractPriceValue(price) {
    if (typeof price === "number") return price;
    if (typeof price === "string") return this.extractNumber(price);

    if (typeof price === "object") {
      // Handle {current: {min: 500}} or {effective: 500}
      const paths = [
        ["current", "min"],
        ["current", "max"],
        ["current", "value"],
        ["effective"],
        ["discounted"],
        ["sale"],
        ["final"],
        ["min"],
        ["max"],
        ["value"],
        ["amount"],
      ];

      for (const path of paths) {
        let val = price;
        for (const key of path) {
          val = val?.[key];
        }
        if (typeof val === "number") return val;
        if (typeof val === "string") return this.extractNumber(val);
      }
    }

    return null;
  }

  /**
   * Extract original/MRP price
   */
  extractOriginalPrice(item) {
    // Tira format: price.marked is the original/MRP price
    if (item.price?.marked && typeof item.price.marked === "object") {
      const marked = item.price.marked;
      if (marked.min !== undefined)
        return typeof marked.min === "number"
          ? marked.min
          : parseFloat(marked.min);
      if (marked.max !== undefined)
        return typeof marked.max === "number"
          ? marked.max
          : parseFloat(marked.max);
    }

    // Other format: price.original.min
    if (item.price?.original && typeof item.price.original === "object") {
      const orig = item.price.original;
      if (orig.min !== undefined)
        return typeof orig.min === "number" ? orig.min : parseFloat(orig.min);
      if (orig.max !== undefined)
        return typeof orig.max === "number" ? orig.max : parseFloat(orig.max);
    }

    // Simple values
    if (item.price?.marked && typeof item.price.marked === "number")
      return item.price.marked;
    if (item.price?.mrp && typeof item.price.mrp === "number")
      return item.price.mrp;
    if (item.price?.original && typeof item.price.original === "number")
      return item.price.original;

    const fields = [
      "original_price",
      "mrp",
      "marked_price",
      "compare_at_price",
    ];
    for (const field of fields) {
      const val = item[field];
      if (typeof val === "number") return val;
      if (typeof val === "string") return parseFloat(val);
    }

    return null;
  }

  /**
   * Extract discount info
   */
  extractDiscount(item) {
    // Check for explicit discount
    if (item.discount) {
      if (typeof item.discount === "string") return item.discount;
      if (typeof item.discount === "number") return `${item.discount}% off`;
    }

    // Check price.discount
    if (item.price?.discount) {
      if (typeof item.price.discount === "number")
        return `${item.price.discount}% off`;
      if (typeof item.price.discount === "string") return item.price.discount;
    }

    // Calculate from prices
    const current = this.extractPriceBasic(item);
    const original = this.extractOriginalPrice(item);

    if (current && original && original > current) {
      const discountPercent = Math.round(
        ((original - current) / original) * 100
      );
      if (discountPercent > 0) return `${discountPercent}% off`;
    }

    return null;
  }

  /**
   * Extract image URL from various formats
   * Handles Tira (medias), Shopify (images), and other common structures
   */
  extractImageBasic(item) {
    // Tira format: medias array with url field
    if (item.medias && Array.isArray(item.medias) && item.medias[0]) {
      const media = item.medias[0];
      if (typeof media === "string") return media;
      if (media.url) return media.url;
      if (media.src) return media.src;
    }

    // Check for media (singular)
    if (item.media) {
      if (typeof item.media === "string") return item.media;
      if (Array.isArray(item.media) && item.media[0]) {
        const m = item.media[0];
        return typeof m === "string" ? m : m.url || m.src;
      }
      if (item.media.url || item.media.src)
        return item.media.url || item.media.src;
    }

    const imageFields = [
      "image",
      "img",
      "thumbnail",
      "photo",
      "picture",
      "image_url",
      "imageUrl",
      "src",
      "featured_image",
    ];

    for (const field of imageFields) {
      const val = item[field];
      if (!val) continue;

      if (typeof val === "string" && val.startsWith("http")) return val;
      if (Array.isArray(val) && val[0]) {
        const first = val[0];
        if (typeof first === "string") return first;
        if (first.url || first.src) return first.url || first.src;
      }
      if (typeof val === "object" && (val.url || val.src)) {
        return val.url || val.src;
      }
    }

    // Check nested images
    if (item.images && Array.isArray(item.images) && item.images[0]) {
      const img = item.images[0];
      if (typeof img === "string") return img;
      if (img.url || img.src) return img.url || img.src;
      // Handle Shopify style: images[].image
      if (img.image) return img.image;
    }

    return null;
  }

  /**
   * Extract number from string or return null
   */
  extractNumber(val) {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const cleaned = val.replace(/[₹$,\s]/g, "");
      const num = parseFloat(cleaned);
      return !isNaN(num) ? num : null;
    }
    return null;
  }
}

module.exports = new ResponseNormalizerService();
