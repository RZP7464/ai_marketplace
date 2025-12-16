import React, { useState, useEffect } from 'react'
import { ShoppingBag, MessageSquare, X, Plus, Minus, Send } from 'lucide-react'
import SidebarProfessional from './components/SidebarProfessional'
import AuthPage from './pages/AuthPage'
import BrandIdentity from './pages/BrandIdentity'
import ApiConfiguration from './pages/ApiConfiguration'
import MerchantDashboardComplete from './pages/MerchantDashboardComplete'
import PublicChat from './pages/PublicChat'

function AppProfessional() {
  // Check current route
  const getCurrentRoute = () => {
    const path = window.location.pathname
    if (path === '/login' || path === '/merchant') return 'auth'
    if (path === '/onboarding' || path === '/brand-identity') return 'brand-identity'
    if (path === '/api-config' || path === '/api-configuration') return 'api-config'
    if (path === '/dashboard') return 'dashboard'
    if (path.startsWith('/chat/')) return 'public-chat'
    return 'main'
  }
  
  const [selectedChat, setSelectedChat] = useState(null)
  const [cart, setCart] = useState([])
  const [messages, setMessages] = useState([])
  const [showProducts, setShowProducts] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [currentRoute, setCurrentRoute] = useState(getCurrentRoute())
  const [merchantData, setMerchantData] = useState(null)
  const [brandData, setBrandData] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Listen for URL changes
  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(getCurrentRoute())
    }
    window.addEventListener('popstate', handleRouteChange)
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])
  
  const [products] = useState([
    {
      id: 1,
      name: 'Classic Leather Sneakers',
      price: 120,
      originalPrice: 144,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
      description: 'Premium leather sneakers with comfort fit',
      rating: 4.5
    },
    {
      id: 2,
      name: 'Cotton T-Shirt',
      price: 120,
      originalPrice: 144,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      description: 'Soft cotton t-shirt, perfect for everyday wear',
      rating: 4.5
    },
    {
      id: 3,
      name: 'Blue Sports Jersey',
      price: 120,
      originalPrice: 144,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
      description: 'Athletic jersey with moisture-wicking fabric',
      rating: 4.5
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
    
    setMessages([...messages, {
      id: Date.now(),
      type: 'assistant',
      text: `Added ${product.name} to your cart!`,
      timestamp: new Date()
    }])
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

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        text: searchQuery,
        timestamp: new Date()
      }
      
      setMessages([...messages, userMessage])
      
      setTimeout(() => {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          text: `I found ${products.length} products matching "${searchQuery}". Check them out below!`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        setShowProducts(true)
      }, 500)
      
      setSearchQuery('')
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Handle merchant login/signup - redirect to brand identity for new signups
  const handleMerchantAuth = (userData, isSignup = false) => {
    setMerchantData(userData)
    if (isSignup) {
      // New signup - go to brand identity page
      window.history.pushState({}, '', '/onboarding')
      setCurrentRoute('brand-identity')
    } else {
      // Existing user login - go to dashboard
      window.history.pushState({}, '', '/dashboard')
      setCurrentRoute('dashboard')
    }
  }

  // Handle brand identity form completion - go to API config
  const handleBrandIdentityNext = (data) => {
    console.log('Brand Identity Data:', data)
    setBrandData(data)
    window.history.pushState({}, '', '/api-config')
    setCurrentRoute('api-config')
  }

  // Navigate back from brand identity to auth
  const handleBrandIdentityBack = () => {
    window.history.pushState({}, '', '/login')
    setCurrentRoute('auth')
  }

  // Handle API configuration completion
  const handleApiConfigNext = (allData) => {
    console.log('All Setup Data:', allData)
    // After complete-setup API call succeeds, go to dashboard
    alert('Setup complete! Redirecting to dashboard...')
    window.history.pushState({}, '', '/dashboard')
    setCurrentRoute('dashboard')
  }

  // Navigate back from API config to brand identity
  const handleApiConfigBack = () => {
    window.history.pushState({}, '', '/onboarding')
    setCurrentRoute('brand-identity')
  }

  // Navigate to login page
  const goToLogin = () => {
    window.history.pushState({}, '', '/login')
    setCurrentRoute('auth')
  }

  // Show public chat (no auth required)
  if (currentRoute === 'public-chat') {
    const merchantSlug = window.location.pathname.split('/chat/')[1];
    return <PublicChat merchantSlug={merchantSlug} />
  }

  // Show merchant dashboard
  if (currentRoute === 'dashboard') {
    return <MerchantDashboardComplete />
  }

  // Show API configuration page
  if (currentRoute === 'api-config') {
    return (
      <ApiConfiguration 
        onNext={handleApiConfigNext}
        onBack={handleApiConfigBack}
        brandData={brandData}
      />
    )
  }

  // Show brand identity page
  if (currentRoute === 'brand-identity') {
    return (
      <BrandIdentity 
        onNext={handleBrandIdentityNext}
        onBack={handleBrandIdentityBack}
      />
    )
  }

  // Show auth page
  if (currentRoute === 'auth') {
    return <AuthPage onLogin={handleMerchantAuth} />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarProfessional 
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        onMerchantLogin={goToLogin}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Shopping Assistant</h1>
              
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-gray-700" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* Welcome / Chat Messages */}
            {messages.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Your Shopping Assistant</h2>
                  <p className="text-gray-600 mb-6">
                    Search for products, ask questions, or let me help you find what you need.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setSearchQuery('sneakers')
                        setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    >
                      Find Sneakers
                    </button>
                    <button
                      onClick={() => {
                        setSearchQuery('t-shirts')
                        setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    >
                      Browse T-Shirts
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-2xl px-4 py-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {showProducts && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-semibold text-gray-900">${product.price}</span>
                            <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice}</span>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cart */}
            {showCart && cart.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Shopping Cart</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <p className="text-lg font-semibold text-gray-900">${item.price}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="px-4 font-medium text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button className="w-full mt-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Input - Fixed at Bottom */}
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask me anything... (e.g., 'Show me sneakers under $100')"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AppProfessional

