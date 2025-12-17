/**
 * MCP (Model Context Protocol) Server Configuration
 *
 * This file contains configuration for integrating with MCP servers
 * that provide ecommerce functionality.
 */

export const mcpConfig = {
  // MCP Server endpoints
  endpoints: {
    search: "/api/mcp/search",
    addToCart: "/api/mcp/cart/add",
    removeFromCart: "/api/mcp/cart/remove",
    updateCart: "/api/mcp/cart/update",
    getCart: "/api/mcp/cart",
    checkout: "/api/mcp/checkout",
    payment: "/api/mcp/payment",
    coupons: "/api/mcp/coupons",
    validateCoupon: "/api/mcp/coupons/validate",
  },

  // Server configuration
  server: {
    baseUrl:
      import.meta.env.VITE_MCP_SERVER_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:3001",
    timeout: 30000, // 30 seconds
    retries: 3,
  },

  // Feature flags
  features: {
    enableSearch: true,
    enableCart: true,
    enableCheckout: true,
    enablePayments: true,
    enableCoupons: true,
    enableRecommendations: true,
  },

  // UI Configuration
  ui: {
    productsPerPage: 12,
    maxCartItems: 50,
    searchDebounceMs: 300,
    messageAnimationMs: 300,
  },
};

/**
 * MCP Server API Client
 * Handles communication with MCP servers
 */
export class MCPClient {
  constructor(config = mcpConfig) {
    this.config = config;
    this.baseUrl = config.server.baseUrl;
  }

  /**
   * Make a request to the MCP server
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.config.server.timeout,
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      if (!response.ok) {
        throw new Error(`MCP Server Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("MCP Client Error:", error);
      throw error;
    }
  }

  /**
   * Search for products
   */
  async searchProducts(query, filters = {}) {
    return this.request(this.config.endpoints.search, {
      method: "POST",
      body: JSON.stringify({ query, filters }),
    });
  }

  /**
   * Add item to cart
   */
  async addToCart(productId, quantity = 1) {
    return this.request(this.config.endpoints.addToCart, {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(productId) {
    return this.request(this.config.endpoints.removeFromCart, {
      method: "DELETE",
      body: JSON.stringify({ productId }),
    });
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(productId, quantity) {
    return this.request(this.config.endpoints.updateCart, {
      method: "PUT",
      body: JSON.stringify({ productId, quantity }),
    });
  }

  /**
   * Get cart contents
   */
  async getCart() {
    return this.request(this.config.endpoints.getCart);
  }

  /**
   * Initiate checkout
   */
  async checkout(cartData, shippingInfo) {
    return this.request(this.config.endpoints.checkout, {
      method: "POST",
      body: JSON.stringify({ cart: cartData, shipping: shippingInfo }),
    });
  }

  /**
   * Process payment
   */
  async processPayment(paymentData) {
    return this.request(this.config.endpoints.payment, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Get available coupons
   */
  async getCoupons() {
    return this.request(this.config.endpoints.coupons);
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(couponCode, cartTotal) {
    return this.request(this.config.endpoints.validateCoupon, {
      method: "POST",
      body: JSON.stringify({ code: couponCode, total: cartTotal }),
    });
  }
}

// Export a default instance
export const mcpClient = new MCPClient();

/**
 * Example Usage:
 *
 * import { mcpClient } from './config/mcpConfig'
 *
 * // Search for products
 * const results = await mcpClient.searchProducts('sneakers')
 *
 * // Add to cart
 * await mcpClient.addToCart(productId, 2)
 *
 * // Get cart
 * const cart = await mcpClient.getCart()
 *
 * // Validate coupon
 * const discount = await mcpClient.validateCoupon('SAVE10', 100)
 */
