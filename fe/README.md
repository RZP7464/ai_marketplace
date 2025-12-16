# Chat Commerce Platform - Frontend

A modern, AI-powered chat-based ecommerce platform built with React, Vite, and Tailwind CSS. This platform allows integration with any app as an MCP (Model Context Protocol) server.

## 🚀 Features

### Core Functionalities
1. **Product Search** - Powered by MCP server integration
2. **Add to Cart** - Seamless cart management
3. **Checkout** - Streamlined checkout process
4. **Payments** - Integrated payment processing
5. **Coupons** - Discount and coupon system
6. **Experience** - Beautiful, modern UI/UX

### UI Components
- **Sidebar** - Company icon, chat history navigation
- **Chat Area** - AI-powered conversational interface
- **Product Display** - Dynamic product grid with images
- **Shopping Cart** - Real-time cart management
- **Command Bar** - Quick actions and search functionality

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

## 📦 Installation

```bash
# Navigate to frontend directory
cd fe

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Design Features

### Modern UI/UX
- Gradient backgrounds and buttons
- Smooth animations and transitions
- Responsive design
- Beautiful color schemes (Blue to Purple gradients)
- Card-based layouts
- Hover effects and micro-interactions

### Layout Structure
```
┌─────────────┬──────────────────┬─────────────────┐
│   Sidebar   │    Chat Area     │ Product Display │
│             │                  │                 │
│  - Icon     │  - Messages      │  - Products     │
│  - Chats    │  - Search Box    │  - Cart View    │
│             │                  │                 │
└─────────────┴──────────────────┴─────────────────┘
                 Command Bar
```

## 🔧 MCP Server Integration

The platform is designed to work with MCP servers for:
- Product search and discovery
- Inventory management
- Order processing
- Payment handling
- Coupon validation
- User experience personalization

## 📱 Components Overview

### Sidebar.jsx
- Company logo/icon display
- Chat history with timestamps
- New chat creation
- Active chat highlighting

### ChatArea.jsx
- Bot and user messages
- Search functionality
- Message history
- Welcome screen with quick actions

### ProductDisplay.jsx
- Product grid layout
- Shopping cart toggle
- Cart management (add, remove, update quantity)
- Checkout button
- Cart summary with totals

### ProductCard.jsx
- Product image
- Product details
- Price display with discounts
- Add to cart button
- Rating display

### CommandBar.jsx
- Quick command buttons
- Text input for custom commands
- AI-powered command processing
- MCP server attribution

### Message.jsx
- Bot and user message styling
- Timestamps
- Avatar icons
- Message animations

## 🎯 Key Features

### Search
- Real-time product search
- Natural language queries
- MCP server-powered results

### Cart Management
- Add/remove items
- Quantity adjustment
- Real-time total calculation
- Persistent cart state

### Chat Interface
- Conversational shopping experience
- AI assistant responses
- Quick action suggestions
- Message history

### Responsive Design
- Works on desktop and tablet
- Smooth scrolling
- Optimized layouts
- Touch-friendly interactions

## 🚀 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## 🔮 Future Enhancements

- Payment gateway integration
- User authentication
- Order history
- Wishlist functionality
- Product recommendations
- Multi-language support
- Dark mode
- Mobile app version

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using React, Vite, and Tailwind CSS

