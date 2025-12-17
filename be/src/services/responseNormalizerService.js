const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Response Normalizer Service
 * 
 * Uses AI to normalize complex API responses into clean, UI-friendly formats
 * Handles:
 * - Complex nested objects
 * - Inconsistent price formats
 * - Messy product structures
 * - Image URL extraction
 * - Data flattening
 */
class ResponseNormalizerService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  /**
   * Normalize product data to standard format
   */
  normalizeProduct(product) {
    if (!product || typeof product !== 'object') return null;

    const normalized = {
      id: product.id || product._id || product.product_id,
      name: this.extractName(product),
      price: this.extractPrice(product),
      image: this.extractImage(product),
      url: this.extractUrl(product),
      description: this.extractDescription(product)
    };

    // Remove null/undefined values
    Object.keys(normalized).forEach(key => {
      if (normalized[key] === null || normalized[key] === undefined) {
        delete normalized[key];
      }
    });

    return normalized;
  }

  /**
   * Extract name from various possible fields
   */
  extractName(product) {
    const fields = ['name', 'title', 'product_name', 'productName', 'display_name', 'displayName'];
    for (const field of fields) {
      if (product[field]) {
        return typeof product[field] === 'object' ? JSON.stringify(product[field]) : String(product[field]);
      }
    }
    return null;
  }

  /**
   * Extract and normalize price from complex structures
   */
  extractPrice(product) {
    const priceFields = ['price', 'cost', 'amount', 'effective_price', 'final_price'];
    
    for (const field of priceFields) {
      const value = product[field];
      if (value !== undefined && value !== null) {
        // Handle complex price objects: {effective: 599, marked: 799}
        if (typeof value === 'object' && !Array.isArray(value)) {
          const effective = value.effective || value.discounted || value.sale || value.final || value.price;
          const original = value.marked || value.original || value.mrp;
          
          if (effective && original) {
            return {
              current: this.parsePrice(effective),
              original: this.parsePrice(original),
              discount: this.calculateDiscount(effective, original)
            };
          }
          
          if (effective) return this.parsePrice(effective);
          if (original) return this.parsePrice(original);
          
          // Try to find any numeric value
          const numericValue = Object.values(value).find(v => typeof v === 'number' || !isNaN(parseFloat(v)));
          if (numericValue) return this.parsePrice(numericValue);
        }
        
        // Handle string/number prices
        return this.parsePrice(value);
      }
    }
    
    return null;
  }

  /**
   * Parse price from string or number
   */
  parsePrice(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      const cleaned = value.replace(/[₹$,]/g, '').trim();
      const num = parseFloat(cleaned);
      return !isNaN(num) ? num : value;
    }
    return value;
  }

  /**
   * Calculate discount percentage
   */
  calculateDiscount(current, original) {
    const c = parseFloat(current);
    const o = parseFloat(original);
    if (!isNaN(c) && !isNaN(o) && o > c) {
      return Math.round(((o - c) / o) * 100);
    }
    return null;
  }

  /**
   * Extract image URL
   */
  extractImage(product) {
    const imageFields = ['image', 'img', 'thumbnail', 'photo', 'picture', 'imageUrl', 'image_url', 'src'];
    
    for (const field of imageFields) {
      const value = product[field];
      if (value) {
        // Handle image objects
        if (typeof value === 'object' && !Array.isArray(value)) {
          return value.url || value.src || value.href;
        }
        // Handle arrays (take first image)
        if (Array.isArray(value) && value.length > 0) {
          const first = value[0];
          return typeof first === 'object' ? (first.url || first.src) : first;
        }
        // Handle strings
        if (typeof value === 'string') {
          return value;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract product URL
   */
  extractUrl(product) {
    const urlFields = ['url', 'link', 'product_url', 'productUrl', 'href', 'permalink'];
    
    for (const field of urlFields) {
      if (product[field] && typeof product[field] === 'string') {
        return product[field];
      }
    }
    
    return null;
  }

  /**
   * Extract description
   */
  extractDescription(product) {
    const descFields = ['description', 'desc', 'summary', 'details', 'short_description'];
    
    for (const field of descFields) {
      if (product[field]) {
        const value = product[field];
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    }
    
    return null;
  }

  /**
   * Normalize array of products
   */
  normalizeProducts(data) {
    if (!data) return [];
    
    // Handle direct array
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeProduct(item)).filter(Boolean);
    }
    
    // Handle nested arrays
    const possibleArrayFields = ['products', 'items', 'results', 'data', 'list'];
    for (const field of possibleArrayFields) {
      if (Array.isArray(data[field])) {
        return data[field].map(item => this.normalizeProduct(item)).filter(Boolean);
      }
    }
    
    // Handle single product
    if (typeof data === 'object') {
      const normalized = this.normalizeProduct(data);
      return normalized ? [normalized] : [];
    }
    
    return [];
  }

  /**
   * Use AI to intelligently normalize complex responses
   */
  async normalizeWithAI(rawData) {
    if (!this.genAI) {
      console.warn('AI normalization unavailable - falling back to basic normalization');
      return this.normalizeProducts(rawData);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Parse this API response and extract clean product data. Make it UI-friendly.

Raw Data:
${JSON.stringify(rawData, null, 2).substring(0, 5000)}

Requirements:
1. Extract all products into a flat array
2. Normalize complex price objects to simple numbers or {current, original}
3. Extract image URLs (even from nested objects)
4. Clean up field names
5. Handle missing data gracefully

Return ONLY valid JSON array in this format:
[
  {
    "id": "unique-id",
    "name": "Product Name",
    "price": 599,
    "image": "https://image-url.jpg",
    "url": "https://product-url",
    "description": "Brief description"
  }
]

If data is too complex or malformed, return best effort extraction.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response
      let jsonText = response.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      const normalized = JSON.parse(jsonText);
      
      // Validate and clean the AI response
      if (Array.isArray(normalized)) {
        return normalized.map(item => this.normalizeProduct(item)).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('AI normalization error:', error);
      // Fallback to basic normalization
      return this.normalizeProducts(rawData);
    }
  }

  /**
   * Normalize tool result for safe rendering
   */
  async normalizeToolResult(toolResult) {
    if (!toolResult || !toolResult.data) return toolResult;

    try {
      // Try AI normalization first for complex data
      const shouldUseAI = this.isComplexData(toolResult.data);
      
      let normalizedData;
      if (shouldUseAI) {
        normalizedData = await this.normalizeWithAI(toolResult.data);
      } else {
        normalizedData = this.normalizeProducts(toolResult.data);
      }

      return {
        ...toolResult,
        data: normalizedData.length > 0 ? normalizedData : toolResult.data,
        normalized: true
      };
    } catch (error) {
      console.error('Normalization error:', error);
      return toolResult;
    }
  }

  /**
   * Check if data is complex enough to warrant AI normalization
   */
  isComplexData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Check depth and complexity
    const str = JSON.stringify(data);
    const depth = (str.match(/\{/g) || []).length;
    const hasNestedArrays = str.includes('[[');
    const hasComplexPrices = str.includes('"effective"') || str.includes('"marked"');
    
    return depth > 5 || hasNestedArrays || hasComplexPrices;
  }
}

module.exports = new ResponseNormalizerService();

