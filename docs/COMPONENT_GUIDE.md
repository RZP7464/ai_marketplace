# 📦 Component Guide

A detailed guide to all components in the Chat Commerce Platform.

## 🗂️ Component Overview

```
src/
├── App.jsx                    # Main application & state management
├── components/
│   ├── Sidebar.jsx           # Left sidebar with icon & chats
│   ├── ChatArea.jsx          # Center chat interface
│   ├── Message.jsx           # Individual chat messages
│   ├── ProductDisplay.jsx    # Right panel for products/cart
│   ├── ProductCard.jsx       # Individual product cards
│   └── CommandBar.jsx        # Bottom command bar
└── config/
    └── mcpConfig.js          # MCP server client
```

---

## 1. App.jsx

**Purpose**: Main application component with state management

### State Management
```javascript
- selectedChat: Currently active chat
- cart: Shopping cart items
- messages: Chat message history
- products: Product catalog
```

### Key Functions
```javascript
addToCart(product)           // Add item to cart
removeFromCart(productId)    // Remove item from cart
updateQuantity(id, qty)      // Update item quantity
handleSearch(query)          // Process search queries
handleCommand(command)       // Process commands
```

### Props Passed to Children
```javascript
<Sidebar 
  selectedChat={selectedChat}
  onSelectChat={setSelectedChat}
/>

<ChatArea 
  messages={messages}
  onSearch={handleSearch}
/>

<ProductDisplay 
  products={products}
  cart={cart}
  onAddToCart={addToCart}
  onRemoveFromCart={removeFromCart}
  onUpdateQuantity={updateQuantity}
/>

<CommandBar 
  onCommand={handleCommand}
/>
```

### Customization Points
- Initial product data (line 8-28)
- Message handling logic (line 45-55)
- Command processing (line 75-95)

---

## 2. Sidebar.jsx

**Purpose**: Left sidebar with company branding and chat history

### Props
```javascript
{
  selectedChat: number | null,    // Currently selected chat ID
  onSelectChat: (id) => void      // Chat selection handler
}
```

### Features
- Company icon/logo display
- Chat list with previews
- New chat button
- Active chat highlighting
- Scroll for long chat lists

### Structure
```
┌─────────────────┐
│   [Icon/Logo]   │
│   Company Name  │
├─────────────────┤
│     Chats       │
│  ┌───────────┐  │
│  │  Chat 1   │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │  Chat 2   │  │
│  └───────────┘  │
└─────────────────┘
```

### Styling
- Width: 320px (w-80)
- Background: White
- Active chat: Blue-purple gradient
- Hover: Gray background

### Customization
- Change icon: Line 21 (`<Store />`)
- Modify chat data: Line 6 (chats array)
- Adjust colors: Line 44-48 (gradient classes)

---

## 3. ChatArea.jsx

**Purpose**: Main chat interface with AI assistant

### Props
```javascript
{
  messages: Array<Message>,       // Chat messages
  onSearch: (query) => void       // Search handler
}
```

### Message Type
```javascript
{
  id: number,
  type: 'bot' | 'user',
  text: string,
  timestamp: Date
}
```

### Features
- Search box in header
- Message history with auto-scroll
- Welcome screen (empty state)
- Quick action buttons
- Bot avatar and status

### Structure
```
┌─────────────────────────┐
│  [Bot Avatar] Assistant │
│  Search: [__________] 🔍│
├─────────────────────────┤
│                         │
│  Bot: Hello!            │
│                         │
│        User: Hi there   │
│                         │
│  Bot: How can I help?   │
│                         │
└─────────────────────────┘
```

### Customization
- Header gradient: Line 27
- Welcome message: Line 51-54
- Quick actions: Line 55-68
- Search placeholder: Line 34

---

## 4. Message.jsx

**Purpose**: Individual chat message bubble

### Props
```javascript
{
  message: {
    id: number,
    type: 'bot' | 'user',
    text: string,
    timestamp: Date
  }
}
```

### Features
- Bot/user styling
- Avatar icons
- Timestamps
- Fade-in animation
- Message alignment

### Styling
- Bot: Left-aligned, gray background
- User: Right-aligned, blue-purple gradient
- Max width: 70% of container
- Rounded corners with tail effect

### Customization
- Bot colors: Line 20-21
- User colors: Line 22-23
- Avatar icons: Line 12, 35
- Timestamp format: Line 28

---

## 5. ProductDisplay.jsx

**Purpose**: Product grid and shopping cart

### Props
```javascript
{
  products: Array<Product>,
  cart: Array<CartItem>,
  onAddToCart: (product) => void,
  onRemoveFromCart: (id) => void,
  onUpdateQuantity: (id, qty) => void
}
```

### Product Type
```javascript
{
  id: number,
  name: string,
  price: number,
  image: string,
  description: string
}
```

### CartItem Type
```javascript
{
  ...Product,
  quantity: number
}
```

### Features
- Toggle between products and cart
- Product grid (2 columns)
- Cart item management
- Quantity adjustment
- Total calculation
- Checkout button
- Cart badge with count

### Views

#### Product View
```
┌─────────────────────┐
│  Products    [🛒 2] │
├─────────────────────┤
│  [img] [img]        │
│  $120  $120         │
│  [Add] [Add]        │
│                     │
│  [img] [img]        │
│  $120  $120         │
│  [Add] [Add]        │
└─────────────────────┘
```

#### Cart View
```
┌─────────────────────┐
│  Your Cart      [✕] │
├─────────────────────┤
│  [img] Product 1    │
│        $120  [-][+] │
│                     │
│  [img] Product 2    │
│        $120  [-][+] │
├─────────────────────┤
│  Total: $240        │
│  [Checkout]         │
└─────────────────────┘
```

### Customization
- Grid columns: Line 52 (grid-cols-2)
- Cart width: Line 13 (w-[600px])
- Header gradient: Line 21
- Checkout button: Line 126-129

---

## 6. ProductCard.jsx

**Purpose**: Individual product card in grid

### Props
```javascript
{
  product: {
    id: number,
    name: string,
    price: number,
    image: string,
    description: string
  },
  onAddToCart: (product) => void
}
```

### Features
- Product image with hover zoom
- Rating badge
- Price display
- Discount price (strikethrough)
- Add to cart button
- Hover effects

### Structure
```
┌─────────────────┐
│     [Image]     │
│      ⭐ 4.5     │
├─────────────────┤
│  Product Name   │
│  Description    │
│  $120  $144     │
│  [Add to Cart]  │
└─────────────────┘
```

### Styling
- Aspect ratio: Square (aspect-square)
- Hover: Scale up image
- Border: Rounded with shadow
- Button: Gradient blue-purple

### Customization
- Rating: Line 13-17
- Discount calculation: Line 30
- Button text: Line 39
- Image zoom: Line 11

---

## 7. CommandBar.jsx

**Purpose**: Bottom command bar with quick actions

### Props
```javascript
{
  onCommand: (command) => void    // Command handler
}
```

### Features
- Quick command buttons
- Text input for custom commands
- Send button
- Icon indicators
- Horizontal scroll for buttons

### Quick Commands
```javascript
[
  { icon: Package, label: 'View Cart', command: 'show my cart' },
  { icon: Tag, label: 'Coupons', command: 'show available coupons' },
  { icon: CreditCard, label: 'Checkout', command: 'proceed to checkout' }
]
```

### Structure
```
┌─────────────────────────────────────────────┐
│  [View Cart] [Coupons] [Checkout]           │
│  ✨ [Ask me anything...............] [Send] │
│  Powered by MCP Servers                     │
└─────────────────────────────────────────────┘
```

### Customization
- Add commands: Line 7-11
- Input placeholder: Line 37
- Button colors: Line 24-26
- Footer text: Line 46

---

## 8. mcpConfig.js

**Purpose**: MCP server client and configuration

### Exports
```javascript
mcpConfig          // Configuration object
MCPClient         // Client class
mcpClient         // Default instance
```

### Configuration
```javascript
{
  endpoints: {...},      // API endpoints
  server: {...},         // Server config
  features: {...},       // Feature flags
  ui: {...}             // UI settings
}
```

### Methods
```javascript
mcpClient.searchProducts(query, filters)
mcpClient.addToCart(productId, quantity)
mcpClient.removeFromCart(productId)
mcpClient.updateCartItem(productId, quantity)
mcpClient.getCart()
mcpClient.checkout(cartData, shippingInfo)
mcpClient.processPayment(paymentData)
mcpClient.getCoupons()
mcpClient.validateCoupon(couponCode, cartTotal)
```

### Usage Example
```javascript
import { mcpClient } from './config/mcpConfig'

// Search
const results = await mcpClient.searchProducts('sneakers')

// Add to cart
await mcpClient.addToCart(123, 2)

// Checkout
await mcpClient.checkout(cart, shipping)
```

### Customization
- Base URL: Line 21 (or env variable)
- Timeout: Line 22
- Endpoints: Line 8-18
- Features: Line 26-33

---

## 🎨 Styling Guide

### Color Palette
```javascript
Primary Blue:    #3b82f6 (blue-500)
Primary Purple:  #9333ea (purple-600)
Accent Pink:     #ec4899 (pink-500)
Accent Yellow:   #fbbf24 (yellow-400)
Gray Scale:      #f9fafb to #1f2937
```

### Gradients
```javascript
Primary:   from-blue-500 to-purple-600
Header:    from-blue-500 to-purple-600
Button:    from-blue-500 to-purple-600
Accent:    from-purple-500 to-pink-600
```

### Spacing
```javascript
Container padding:  p-4 to p-6
Gap between items:  gap-2 to gap-4
Border radius:      rounded-xl (12px)
Shadow:            shadow-lg
```

### Typography
```javascript
Heading:    text-xl to text-2xl, font-bold
Body:       text-sm to text-base
Small:      text-xs
Colors:     text-gray-800, text-gray-600, text-gray-400
```

---

## 🔧 Common Customizations

### Change Primary Color
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#your-color',
    600: '#your-darker-color',
  }
}
```

### Add New Quick Command
Edit `CommandBar.jsx`:
```javascript
const quickCommands = [
  // ... existing commands
  { icon: YourIcon, label: 'Your Label', command: 'your command' }
]
```

### Modify Product Grid
Edit `ProductDisplay.jsx` line 52:
```javascript
// 2 columns
<div className="grid grid-cols-2 gap-4">

// 3 columns
<div className="grid grid-cols-3 gap-4">
```

### Change Sidebar Width
Edit `Sidebar.jsx` line 13:
```javascript
// Current: 320px
<div className="w-80 ...">

// Wider: 384px
<div className="w-96 ...">
```

### Customize Welcome Message
Edit `ChatArea.jsx` lines 51-54:
```javascript
<h3>Your Custom Title</h3>
<p>Your custom welcome message</p>
```

---

## 🐛 Debugging Tips

### Component Not Rendering
1. Check props are passed correctly
2. Verify data structure matches expected type
3. Check console for errors
4. Ensure imports are correct

### Styling Issues
1. Check Tailwind classes are valid
2. Verify no conflicting styles
3. Use browser DevTools to inspect
4. Check responsive breakpoints

### State Not Updating
1. Verify state setter is called
2. Check for immutability issues
3. Use React DevTools to inspect state
4. Ensure props are passed down correctly

### MCP Integration Issues
1. Check server URL in .env
2. Verify endpoints match server
3. Check network tab for requests
4. Test with mock data first

---

## 📚 Additional Resources

- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Vite: https://vitejs.dev
- Lucide Icons: https://lucide.dev

---

Happy coding! 🚀

