import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, MessageSquare, X, Plus, Minus, Send, Loader, Star, ChevronRight, Sparkles } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function PublicChat({ merchantSlug }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [merchantData, setMerchantData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState([]);
  const [showProducts, setShowProducts] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  // Initialize session and fetch merchant data
  useEffect(() => {
    const init = async () => {
      // Generate or retrieve session ID
      let sid = localStorage.getItem(`chat_session_${merchantSlug}`);
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(`chat_session_${merchantSlug}`, sid);
      }
      setSessionId(sid);

      // Load cart from localStorage
      const savedCart = localStorage.getItem(`cart_${merchantSlug}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      // Fetch merchant data
      await fetchMerchantData();
      setIsInitializing(false);
    };
    init();
  }, [merchantSlug]);

  // Save cart to localStorage
  useEffect(() => {
    if (merchantSlug) {
      localStorage.setItem(`cart_${merchantSlug}`, JSON.stringify(cart));
    }
  }, [cart, merchantSlug]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMerchantData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant/public/${merchantSlug}`);
      const data = await response.json();
      if (data.success) {
        setMerchantData(data.data);
        // Add welcome message
        const welcomeMsg = data.data.welcomeMessage || 
          `Hi! I'm ${data.data.displayName || data.data.name}'s AI assistant. How can I help you today?`;
        setMessages([{
          id: 'welcome',
          type: 'assistant',
          text: welcomeMsg,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch merchant data:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/public/${merchantSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          sessionId: sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Check if response contains products (from MCP tool)
        let responseText = data.data.response;
        let extractedProducts = [];

        // Try to extract products from response
        if (data.data.toolsUsed && data.data.toolResult) {
          extractedProducts = parseProductsFromToolResult(data.data.toolResult);
        }

        // Also try to parse products from response text if it looks like JSON
        if (extractedProducts.length === 0) {
          extractedProducts = tryParseProductsFromText(responseText);
        }

        if (extractedProducts.length > 0) {
          setProducts(extractedProducts);
          setShowProducts(true);
        }

        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          text: responseText,
          timestamp: new Date(),
          hasProducts: extractedProducts.length > 0
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse products from MCP tool result
  const parseProductsFromToolResult = (toolResult) => {
    try {
      if (typeof toolResult === 'string') {
        toolResult = JSON.parse(toolResult);
      }
      
      // Handle various API response formats
      let items = toolResult.products || toolResult.items || toolResult.data?.products || 
                  toolResult.data?.items || toolResult.results || [];
      
      if (!Array.isArray(items)) return [];

      return items.slice(0, 6).map((item, idx) => ({
        id: item.id || item.product_id || idx + 1,
        name: item.name || item.title || item.product_name || 'Product',
        price: parseFloat(item.price || item.selling_price || item.cost || 0),
        originalPrice: parseFloat(item.original_price || item.mrp || item.price || 0) * 1.2,
        image: item.image || item.image_url || item.thumbnail || item.images?.[0] || 
               `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop`,
        description: item.description || item.short_description || '',
        rating: item.rating || 4.5
      }));
    } catch (e) {
      return [];
    }
  };

  // Try to parse products from text response
  const tryParseProductsFromText = (text) => {
    try {
      // Look for JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*"products"[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return parseProductsFromToolResult(data);
      }
    } catch (e) {}
    return [];
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    // Add confirmation message
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'assistant',
      text: `Added ${product.name} to your cart! 🛒`,
      timestamp: new Date()
    }]);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Loading state
  if (isInitializing || !merchantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading {merchantSlug}...</p>
        </div>
      </div>
    );
  }

  // Dynamic colors from merchant settings
  const primaryColor = merchantData.dynamicSettings?.primaryColor || '#3B82F6';
  const secondaryColor = merchantData.dynamicSettings?.secondaryColor || '#60A5FA';
  const accentColor = merchantData.dynamicSettings?.accentColor || '#F472B6';

  return (
    <div className="flex h-screen" style={{ background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)` }}>
      {/* Sidebar - Chat History */}
      <div className="w-72 border-r border-white/10 flex flex-col" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {merchantData.logo ? (
              <img src={merchantData.logo} alt={merchantData.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {(merchantData.displayName || merchantData.name || 'A').charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-white font-semibold text-sm">{merchantData.displayName || merchantData.name}</h1>
              <p className="text-gray-400 text-xs">{merchantData.tagline || 'AI Shopping Assistant'}</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Categories</h3>
          <div className="space-y-2">
            {(merchantData.categories || ['All Products', 'New Arrivals', 'Best Sellers']).map((category, idx) => (
              <button
                key={idx}
                onClick={() => setInputMessage(`Show me ${category}`)}
                className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
              >
                <ChevronRight size={14} className="text-gray-500" />
                {category}
              </button>
            ))}
          </div>

          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3 mt-6">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => setInputMessage('Search for trending products')}
              className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
            >
              <Sparkles size={14} style={{ color: accentColor }} />
              Trending Now
            </button>
            <button
              onClick={() => setInputMessage('Show me deals and offers')}
              className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
            >
              <Star size={14} style={{ color: accentColor }} />
              Deals & Offers
            </button>
          </div>
        </div>

        {/* Powered By */}
        <div className="p-4 border-t border-white/10">
          <p className="text-gray-500 text-xs text-center">
            Powered by AI Marketplace
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header 
          className="border-b border-white/10 backdrop-blur-md"
          style={{ background: `linear-gradient(90deg, ${primaryColor}15, ${secondaryColor}15)` }}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
                <h1 className="text-lg font-semibold text-white">Shopping Assistant</h1>
              </div>

              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ShoppingBag className="w-6 h-6 text-gray-300" />
                {cartItemCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-semibold rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6">
            {/* Welcome / Chat Messages */}
            {messages.length <= 1 ? (
              <div 
                className="rounded-xl p-8 mb-6 border border-white/10"
                style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)` }}
              >
                <div className="max-w-2xl mx-auto text-center">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Welcome to {merchantData.displayName || merchantData.name}!
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {merchantData.welcomeMessage || 'Search for products, ask questions, or let me help you find what you need.'}
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button
                      onClick={() => setInputMessage('Search for lipstick')}
                      className="px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white border border-white/20 hover:bg-white/10"
                    >
                      🔍 Search Products
                    </button>
                    <button
                      onClick={() => setInputMessage('Show me new arrivals')}
                      className="px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white border border-white/20 hover:bg-white/10"
                    >
                      ✨ New Arrivals
                    </button>
                    <button
                      onClick={() => setInputMessage('What are your best sellers?')}
                      className="px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white border border-white/20 hover:bg-white/10"
                    >
                      🔥 Best Sellers
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
                      className={`max-w-2xl px-4 py-3 rounded-xl ${
                        message.type === 'user'
                          ? 'text-white'
                          : 'bg-white/10 backdrop-blur-md border border-white/10 text-white'
                      }`}
                      style={message.type === 'user' ? {
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                      } : {}}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-4 py-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Loader size={16} className="animate-spin" style={{ color: primaryColor }} />
                        <span className="text-sm text-gray-300">Searching...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Products Grid */}
            {showProducts && products.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles size={18} style={{ color: accentColor }} />
                  Products for You
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all hover:shadow-xl"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
                          }}
                        />
                        {product.originalPrice > product.price && (
                          <span 
                            className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold text-white rounded"
                            style={{ background: accentColor }}
                          >
                            {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-white text-sm mb-1 line-clamp-2">{product.name}</h4>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                            />
                          ))}
                          <span className="text-gray-500 text-xs ml-1">{product.rating}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-white font-semibold">₹{product.price.toLocaleString()}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-gray-500 text-sm line-through ml-2">
                                ₹{product.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="p-2 rounded-lg transition-colors text-white"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Search for products, ask questions..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                style={{ focusRingColor: primaryColor }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-3 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <Send size={18} />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="w-96 border-l border-white/10 flex flex-col" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Cart ({cartItemCount})</h2>
            <button
              onClick={() => setShowCart(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop';
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white line-clamp-1">{item.name}</h4>
                      <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <Minus size={14} className="text-gray-400" />
                        </button>
                        <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <Plus size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors self-start"
                    >
                      <X size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Total</span>
                <span className="text-xl font-semibold text-white">₹{cartTotal.toLocaleString()}</span>
              </div>
              <button
                onClick={() => setInputMessage('Proceed to checkout')}
                className="w-full py-3 text-white rounded-xl font-medium transition-all hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PublicChat;
