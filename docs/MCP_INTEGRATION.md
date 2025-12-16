# MCP Server Integration Guide

This guide explains how to integrate your MCP (Model Context Protocol) server with the Chat Commerce Platform.

## 📋 Overview

The platform is designed to work with any MCP server that implements the standard ecommerce operations:
1. Product Search
2. Cart Management
3. Checkout Process
4. Payment Processing
5. Coupon Validation
6. User Experience Personalization

## 🔌 Integration Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   React App     │ ◄─────► │  MCP Client  │ ◄─────► │ MCP Server  │
│   (Frontend)    │         │   (Bridge)   │         │  (Backend)  │
└─────────────────┘         └──────────────┘         └─────────────┘
```

## 🚀 Quick Start

### 1. Configure MCP Server URL

Create a `.env` file in the `fe` directory:

```bash
cp env.example .env
```

Edit `.env`:
```env
VITE_MCP_SERVER_URL=http://your-mcp-server:8000
```

### 2. Import MCP Client

```javascript
import { mcpClient } from './config/mcpConfig'
```

### 3. Use MCP Client Methods

```javascript
// Search products
const products = await mcpClient.searchProducts('sneakers')

// Add to cart
await mcpClient.addToCart(productId, quantity)

// Checkout
await mcpClient.checkout(cartData, shippingInfo)
```

## 📡 API Endpoints

Your MCP server should implement these endpoints:

### 1. Product Search
```
POST /api/mcp/search
Content-Type: application/json

Request:
{
  "query": "sneakers",
  "filters": {
    "minPrice": 0,
    "maxPrice": 200,
    "category": "footwear",
    "brand": "Nike"
  }
}

Response:
{
  "success": true,
  "products": [
    {
      "id": "prod_123",
      "name": "Classic Sneakers",
      "price": 120,
      "image": "https://...",
      "description": "...",
      "rating": 4.5,
      "inStock": true
    }
  ],
  "total": 15,
  "page": 1
}
```

### 2. Add to Cart
```
POST /api/mcp/cart/add
Content-Type: application/json

Request:
{
  "productId": "prod_123",
  "quantity": 2
}

Response:
{
  "success": true,
  "cart": {
    "items": [...],
    "total": 240,
    "itemCount": 2
  }
}
```

### 3. Get Cart
```
GET /api/mcp/cart

Response:
{
  "success": true,
  "cart": {
    "items": [
      {
        "productId": "prod_123",
        "name": "Classic Sneakers",
        "price": 120,
        "quantity": 2,
        "subtotal": 240
      }
    ],
    "subtotal": 240,
    "tax": 20,
    "shipping": 0,
    "total": 260
  }
}
```

### 4. Update Cart Item
```
PUT /api/mcp/cart/update
Content-Type: application/json

Request:
{
  "productId": "prod_123",
  "quantity": 3
}

Response:
{
  "success": true,
  "cart": {...}
}
```

### 5. Remove from Cart
```
DELETE /api/mcp/cart/remove
Content-Type: application/json

Request:
{
  "productId": "prod_123"
}

Response:
{
  "success": true,
  "cart": {...}
}
```

### 6. Checkout
```
POST /api/mcp/checkout
Content-Type: application/json

Request:
{
  "cart": {...},
  "shipping": {
    "name": "John Doe",
    "address": "123 Main St",
    "city": "New York",
    "zip": "10001",
    "country": "USA"
  }
}

Response:
{
  "success": true,
  "orderId": "order_456",
  "total": 260,
  "paymentUrl": "https://..."
}
```

### 7. Process Payment
```
POST /api/mcp/payment
Content-Type: application/json

Request:
{
  "orderId": "order_456",
  "paymentMethod": "card",
  "paymentDetails": {
    "token": "tok_123"
  }
}

Response:
{
  "success": true,
  "transactionId": "txn_789",
  "status": "completed"
}
```

### 8. Get Coupons
```
GET /api/mcp/coupons

Response:
{
  "success": true,
  "coupons": [
    {
      "code": "SAVE10",
      "description": "10% off your order",
      "discount": 10,
      "type": "percentage",
      "minPurchase": 50,
      "expiresAt": "2024-12-31"
    }
  ]
}
```

### 9. Validate Coupon
```
POST /api/mcp/coupons/validate
Content-Type: application/json

Request:
{
  "code": "SAVE10",
  "total": 100
}

Response:
{
  "success": true,
  "valid": true,
  "discount": 10,
  "newTotal": 90,
  "message": "Coupon applied successfully"
}
```

## 🔧 Implementation Example

### Integrate Search in ChatArea Component

```javascript
// src/components/ChatArea.jsx
import { mcpClient } from '../config/mcpConfig'

const handleSearch = async (query) => {
  try {
    // Show loading message
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: query,
      timestamp: new Date()
    }])

    // Call MCP server
    const response = await mcpClient.searchProducts(query)
    
    // Update products
    setProducts(response.products)
    
    // Show bot response
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      type: 'bot',
      text: `Found ${response.total} products matching "${query}"`,
      timestamp: new Date()
    }])
  } catch (error) {
    console.error('Search error:', error)
    // Show error message
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      type: 'bot',
      text: 'Sorry, I encountered an error searching for products.',
      timestamp: new Date()
    }])
  }
}
```

### Integrate Cart Operations in App Component

```javascript
// src/App.jsx
import { mcpClient } from './config/mcpConfig'

const addToCart = async (product) => {
  try {
    // Call MCP server
    const response = await mcpClient.addToCart(product.id, 1)
    
    // Update local cart state
    setCart(response.cart.items)
    
    // Show success message
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'bot',
      text: `Added ${product.name} to your cart!`,
      timestamp: new Date()
    }])
  } catch (error) {
    console.error('Add to cart error:', error)
    // Handle error
  }
}
```

## 🔐 Authentication

If your MCP server requires authentication, add the token to requests:

```javascript
// src/config/mcpConfig.js
export class MCPClient {
  constructor(config = mcpConfig) {
    this.config = config
    this.baseUrl = config.server.baseUrl
    this.authToken = null
  }

  setAuthToken(token) {
    this.authToken = token
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      ...options.headers,
    }

    // ... rest of implementation
  }
}
```

## 🧪 Testing

### Mock MCP Server

For development, you can create a mock server:

```javascript
// src/config/mockMcpServer.js
export const mockMcpServer = {
  searchProducts: async (query) => {
    return {
      success: true,
      products: [
        // ... mock products
      ],
      total: 10
    }
  },
  
  addToCart: async (productId, quantity) => {
    return {
      success: true,
      cart: {
        items: [/* ... */],
        total: 120
      }
    }
  },
  
  // ... other methods
}
```

Use it in development:

```javascript
import { mcpClient } from './config/mcpConfig'
import { mockMcpServer } from './config/mockMcpServer'

const client = process.env.NODE_ENV === 'development' 
  ? mockMcpServer 
  : mcpClient
```

## 📊 Error Handling

Implement proper error handling:

```javascript
try {
  const result = await mcpClient.searchProducts(query)
  // Handle success
} catch (error) {
  if (error.response?.status === 404) {
    // No products found
  } else if (error.response?.status === 500) {
    // Server error
  } else {
    // Network error
  }
}
```

## 🎯 Best Practices

1. **Retry Logic**: Implement retry for failed requests
2. **Caching**: Cache product data to reduce API calls
3. **Loading States**: Show loading indicators during API calls
4. **Error Messages**: Display user-friendly error messages
5. **Timeout**: Set appropriate timeout values
6. **Rate Limiting**: Respect rate limits from MCP server
7. **Debouncing**: Debounce search queries to reduce API calls

## 🔄 State Management

Consider using a state management library for complex apps:

```javascript
// Example with Context API
import { createContext, useContext, useState } from 'react'
import { mcpClient } from './config/mcpConfig'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  
  const addToCart = async (product) => {
    const response = await mcpClient.addToCart(product.id, 1)
    setCart(response.cart.items)
  }
  
  return (
    <CartContext.Provider value={{ cart, addToCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
```

## 📝 Environment Variables

Required environment variables:

```env
# MCP Server
VITE_MCP_SERVER_URL=http://localhost:8000

# Optional
VITE_API_KEY=your_api_key
VITE_ENABLE_MOCK=false
VITE_REQUEST_TIMEOUT=30000
```

## 🚀 Deployment

When deploying, ensure:

1. MCP server URL is set correctly
2. CORS is configured on MCP server
3. API keys are securely stored
4. HTTPS is used in production
5. Rate limiting is configured

## 📞 Support

For issues or questions:
- Check MCP server logs
- Verify API endpoint URLs
- Test with curl/Postman first
- Check network tab in browser DevTools

---

Happy integrating! 🎉

