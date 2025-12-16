# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

## Installation & Setup

### 1. Install Dependencies
```bash
cd fe
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The application will open automatically at `http://localhost:3000`

## 🎯 What You'll See

### Main Interface
The app opens with three main sections:

1. **Left Sidebar** (Company & Chats)
   - Company icon at the top
   - Chat history below
   - Click any chat to view conversation

2. **Center Area** (Chat Interface)
   - AI Shopping Assistant
   - Search box for products
   - Message history
   - Welcome screen with quick actions

3. **Right Panel** (Products & Cart)
   - Product grid with images
   - Add to cart buttons
   - Shopping cart icon (click to view cart)
   - Checkout functionality

4. **Bottom Bar** (Commands)
   - Quick action buttons
   - Command input field
   - Send messages to AI assistant

## 🎮 Try These Actions

### Search for Products
1. Type in the search box: "sneakers"
2. Click Search or press Enter
3. See AI response and product results

### Add to Cart
1. Click "Add" button on any product card
2. See cart icon update with item count
3. Click cart icon to view your cart

### Use Quick Commands
Click any quick command button:
- **View Cart** - See all items in cart
- **Coupons** - View available discounts
- **Checkout** - Start checkout process

### Chat with AI Assistant
1. Type a question in the command bar
2. Examples:
   - "Show me products under $100"
   - "What's in my cart?"
   - "Do you have any coupons?"

## 🎨 Features to Explore

### Product Cards
- Hover over products for animation
- See ratings and prices
- Discounted prices shown
- One-click add to cart

### Shopping Cart
- Adjust quantities with +/- buttons
- Remove items with X button
- See real-time total
- Proceed to checkout

### Chat Interface
- Conversational shopping
- Natural language queries
- AI-powered responses
- Message history

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## 📁 Project Structure

```
fe/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # Left sidebar with chats
│   │   ├── ChatArea.jsx         # Main chat interface
│   │   ├── ProductDisplay.jsx   # Product grid & cart
│   │   ├── ProductCard.jsx      # Individual product card
│   │   ├── Message.jsx          # Chat message component
│   │   └── CommandBar.jsx       # Bottom command bar
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # App entry point
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js              # Vite configuration
└── tailwind.config.js          # Tailwind CSS config
```

## 🎯 Next Steps

1. **Integrate MCP Server**
   - Connect your MCP server for product search
   - Implement real product data
   - Add authentication

2. **Add Payment Gateway**
   - Integrate payment processing
   - Add order confirmation
   - Implement receipt generation

3. **Enhance Features**
   - Add user profiles
   - Implement order history
   - Add wishlist functionality
   - Enable product reviews

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is busy, Vite will automatically use the next available port.

### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Build Errors
Make sure you're using Node.js 18 or higher:
```bash
node --version
```

## 💡 Tips

- Use the search box for quick product discovery
- Try the quick command buttons for common actions
- Click the cart icon to toggle between products and cart view
- Hover over products to see animations
- The chat interface supports natural language queries

---

Enjoy building your chat commerce platform! 🎉

