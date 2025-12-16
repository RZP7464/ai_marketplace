import React, { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import ProductDisplay from './components/ProductDisplay'
import CommandBar from './components/CommandBar'
import AuthPage from './pages/AuthPage'

function App() {
  // Simple hash-based routing for merchant login
  const [currentPage, setCurrentPage] = useState(window.location.hash === '#/merchant' ? 'merchant' : 'chatbot')
  const [merchantUser, setMerchantUser] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [cart, setCart] = useState([])
  const [messages, setMessages] = useState([])
  const [showProducts, setShowProducts] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Classic Leather Sneakers',
      price: 120,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
      description: 'Premium leather sneakers with comfort fit'
    },
    {
      id: 2,
      name: 'Cotton T-Shirt',
      price: 120,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      description: 'Soft cotton t-shirt, perfect for everyday wear'
    },
    {
      id: 3,
      name: 'Blue Sports Jersey',
      price: 120,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
      description: 'Athletic jersey with moisture-wicking fabric'
    }
  ])

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
    
    // Add bot message to chat
    setMessages([...messages, {
      id: Date.now(),
      type: 'bot',
      text: `Added ${product.name} to your cart!`,
      timestamp: new Date()
    }])
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!')
      return
    }
    setShowCart(true)
    setTimeout(() => {
      const cartSection = document.getElementById('cart-section')
      if (cartSection) {
        cartSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleRegkart = () => {
    // Placeholder for Regkart functionality
    alert('Regkart feature coming soon!')
  }

  const toggleCart = () => {
    setShowCart(!showCart)
    if (!showCart) {
      setTimeout(() => {
        const cartSection = document.getElementById('cart-section')
        if (cartSection) {
          cartSection.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity === 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  // Handle merchant login
  const handleMerchantLogin = (userData) => {
    setMerchantUser(userData)
    // Redirect to merchant dashboard after login
    window.location.hash = '#/merchant/dashboard'
    // For now, just go back to chatbot or show dashboard
    alert('Login successful! Merchant dashboard coming soon.')
    window.location.hash = ''
    setCurrentPage('chatbot')
  }

  // Listen for hash changes
  React.useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/merchant') {
        setCurrentPage('merchant')
      } else {
        setCurrentPage('chatbot')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Show merchant auth page if on merchant route
  if (currentPage === 'merchant') {
    return <AuthPage onLogin={handleMerchantLogin} />
  }

  const handleCommand = (command) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: command,
      timestamp: new Date()
    }
    
    setMessages([...messages, userMessage])
    
    // Simulate bot response based on command
    setTimeout(() => {
      let botResponse = ''
      let shouldShowProducts = false
      
      // Check if it's a search query
      if (command.toLowerCase().includes('search') || 
          command.toLowerCase().includes('find') || 
          command.toLowerCase().includes('show') ||
          command.toLowerCase().includes('sneaker') ||
          command.toLowerCase().includes('shirt') ||
          command.toLowerCase().includes('product') ||
          command.toLowerCase().includes('browse') ||
          command.toLowerCase().includes('looking for')) {
        botResponse = `I found ${products.length} products for you. Check them out below!`
        shouldShowProducts = true
      } else if (command.toLowerCase().includes('cart')) {
        botResponse = `You have ${cart.length} items in your cart. Total: $${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}`
      } else if (command.toLowerCase().includes('checkout')) {
        botResponse = 'Let me help you with checkout. Please confirm your shipping address.'
      } else if (command.toLowerCase().includes('coupon')) {
        botResponse = 'Here are available coupons: SAVE10 (10% off), FREESHIP (Free shipping)'
      } else {
        botResponse = 'How can I assist you today? You can search for products, check your cart, or proceed to checkout.'
      }
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: botResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      
      // Show products and scroll to them if it's a search query
      if (shouldShowProducts) {
        setShowProducts(true)
        setTimeout(() => {
          const productSection = document.getElementById('products-section')
          if (productSection) {
            productSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 800)
      }
    }, 500)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Sidebar */}
      <Sidebar 
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
        {/* Main Card Container */}
        <div className="flex-1 m-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 flex items-center justify-between bg-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🛍️</span>
              </div>
              <span className="text-white font-bold text-lg">Logbot</span>
            </div>
            <button
              onClick={toggleCart}
              className="relative p-3 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg transition-all"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-blue-50/50 to-purple-50/50 backdrop-blur-sm">
            {/* Chat Area */}
            <div className={showProducts ? "min-h-[40vh]" : "h-full"}>
              <ChatArea 
                messages={messages}
                cart={cart}
                onAddToCart={addToCart}
              />
            </div>
            
            {/* Product Display - Only show when user searches */}
            {showProducts && (
              <div id="products-section">
                <ProductDisplay 
                  products={products}
                  cart={cart}
                  onAddToCart={addToCart}
                  onRemoveFromCart={removeFromCart}
                  onUpdateQuantity={updateQuantity}
                  showCart={showCart}
                  onToggleCart={toggleCart}
                />
              </div>
            )}

            {/* Cart Section - Show when cart icon is clicked */}
            {showCart && cart.length > 0 && (
              <div id="cart-section" className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Your Cart</h3>
                    <button
                      onClick={() => setShowCart(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">{item.name}</h4>
                          <p className="text-blue-600 font-bold text-sm">${item.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors self-start"
                        >
                          <span className="text-red-500">✕</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Cart Summary */}
                  <div className="border-t border-gray-200 pt-4 space-y-3 bg-white rounded-xl p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-800">${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                      <span className="text-gray-800">Total</span>
                      <span className="text-blue-600">${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    
                    <button 
                      onClick={() => alert('Proceeding to checkout...')}
                      className="w-full mt-4 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Command Bar */}
          <div className="p-4 bg-white/90 backdrop-blur-sm">
            <CommandBar 
              onCommand={handleCommand}
              onCheckout={handleCheckout}
              onRegkart={handleRegkart}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

