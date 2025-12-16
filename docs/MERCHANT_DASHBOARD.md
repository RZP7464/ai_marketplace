# 🏪 Merchant Onboarding Dashboard

A comprehensive merchant dashboard for configuring AI-powered shopping assistants.

## 📋 Features

### 🔐 **Merchant Login**
- Secure email/password authentication
- Remember me functionality
- Password visibility toggle
- Forgot password link
- Beautiful gradient UI

### 🎛️ **Dashboard Configuration**

#### **1. Store Information**
- Merchant Name
- Store Name
- Logo URL

#### **2. API Configuration**

##### **Search Products API**
- Endpoint configuration
- Expected response format
- Secure API key storage

##### **Add to Cart API**
- Cart management endpoint
- Payload specifications
- Response format

##### **Checkout API**
- Checkout process endpoint
- Order creation
- Shipping information handling

##### **Payments API**
- Payment processing endpoint
- Transaction handling
- Payment method support

##### **Coupons API**
- Coupon validation endpoint
- Discount calculation
- Validity checking

#### **3. Experience Configuration**
- Primary Color (color picker)
- Secondary Color (color picker)
- Welcome Message (customizable)
- Assistant Name (customizable)

## 🚀 Usage

### Running the Merchant Dashboard

To use the merchant dashboard instead of the customer app, update `main.jsx`:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import MerchantApp from './MerchantApp.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MerchantApp />
  </React.StrictMode>,
)
```

### Login Credentials (Demo)
- **Email**: Any valid email
- **Password**: Any password (demo mode)

## 📐 Layout

```
┌─────────────────────────────────────────────────┐
│  Header: Merchant Dashboard | [Logout]          │
├──────────────┬──────────────────────────────────┤
│              │                                   │
│  Store Info  │     API Configuration            │
│              │                                   │
│  - Name      │  🔍 Search API                   │
│  - Store     │  🛒 Add to Cart API              │
│  - Logo      │  📦 Checkout API                 │
│              │  💳 Payments API                 │
│  Experience  │  🏷️ Coupons API                  │
│              │                                   │
│  - Colors    │  [Save Configuration]            │
│  - Messages  │                                   │
│              │                                   │
└──────────────┴──────────────────────────────────┘
```

## 🎨 Design Features

### Login Page
- Gradient background (blue → purple → pink)
- Centered card layout
- Store icon with gradient
- Form validation
- Loading states
- Responsive design

### Dashboard
- Clean header with logout
- Two-column layout
- Card-based sections
- Color-coded API sections
- Password-protected API fields
- Eye icon to show/hide API keys
- Info boxes with API specifications
- Gradient save button

## 🔒 Security Features

- API endpoints hidden by default (password field)
- Eye icon to toggle visibility
- Secure storage recommendations
- Form validation

## 📊 API Specifications

### Search Products API
```json
{
  "endpoint": "https://api.yourstore.com/search",
  "method": "POST",
  "payload": { "query": "sneakers" },
  "response": {
    "products": [
      {
        "id": 1,
        "name": "Product Name",
        "price": 120,
        "image": "url",
        "description": "..."
      }
    ]
  }
}
```

### Add to Cart API
```json
{
  "endpoint": "https://api.yourstore.com/cart/add",
  "method": "POST",
  "payload": { "productId": 1, "quantity": 2 },
  "response": {
    "cart": { "items": [...], "total": 240 }
  }
}
```

### Checkout API
```json
{
  "endpoint": "https://api.yourstore.com/checkout",
  "method": "POST",
  "payload": {
    "cart": {...},
    "shipping": {
      "name": "John Doe",
      "address": "123 Main St",
      "city": "New York",
      "zip": "10001"
    }
  },
  "response": {
    "orderId": "ORD123",
    "total": 260
  }
}
```

### Payments API
```json
{
  "endpoint": "https://api.yourstore.com/payments",
  "method": "POST",
  "payload": {
    "orderId": "ORD123",
    "paymentMethod": "card",
    "amount": 260
  },
  "response": {
    "transactionId": "TXN456",
    "status": "success"
  }
}
```

### Coupons API
```json
{
  "endpoint": "https://api.yourstore.com/coupons/validate",
  "method": "POST",
  "payload": {
    "couponCode": "SAVE10",
    "cartTotal": 100
  },
  "response": {
    "valid": true,
    "discount": 10,
    "newTotal": 90
  }
}
```

## 🎯 Configuration Flow

1. **Login** → Enter credentials
2. **Store Setup** → Fill store information
3. **API Configuration** → Add all API endpoints
4. **Experience** → Customize colors and messages
5. **Save** → Store configuration
6. **Deploy** → Your AI assistant is ready!

## 📱 Responsive Design

- Desktop: Full two-column layout
- Tablet: Stacked columns
- Mobile: Single column, full width

## 🔄 State Management

The dashboard maintains:
- Login state
- Merchant information
- API configurations
- Experience settings
- Form validation states

## 🎨 Color Customization

Merchants can customize:
- **Primary Color**: Main brand color
- **Secondary Color**: Accent color
- Colors update in real-time
- Hex code input supported
- Color picker included

## 💾 Save Functionality

When "Save Configuration" is clicked:
1. Validates all fields
2. Stores configuration (console.log for demo)
3. Shows success message
4. Ready for API integration

## 🚀 Next Steps

To integrate with backend:
1. Connect login API
2. Add authentication tokens
3. Store configuration in database
4. Implement real API calls
5. Add configuration validation
6. Deploy to production

---

**Built with React, Vite, and Tailwind CSS** 🎉

