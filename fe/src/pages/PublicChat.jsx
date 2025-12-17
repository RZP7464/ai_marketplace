import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, MessageSquare, X, Plus, Minus, Send, Loader, Star, ChevronRight, Sparkles, Wrench, Zap, Info, CheckCircle } from 'lucide-react';
import ToolResultRenderer from '../components/ToolResultRenderer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * PublicChat Component
 * 
 * Supports two URL formats:
 * 1. New format: /chat/:merchantId/:sessionId (session-based with history)
 * 2. Old format: /chat/:merchantSlug (backward compatibility)
 * 
 * @param {number} merchantId - Merchant ID (new format)
 * @param {number} sessionId - Session ID (new format, optional - will create new if not provided)
 * @param {string} merchantSlug - Merchant slug (old format, backward compatibility)
 */
function PublicChat({ merchantId, sessionId: initialSessionId, merchantSlug }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [merchantData, setMerchantData] = useState(null);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mcpTools, setMcpTools] = useState([]);
  const [showMcpPanel, setShowMcpPanel] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Determine if using new format (merchantId-based) or old format (slug-based)
  const isNewFormat = !!merchantId;
  const cacheKey = isNewFormat ? `merchant_${merchantId}` : merchantSlug;

  // Initialize session and fetch merchant data
  useEffect(() => {
    const init = async () => {
      if (isNewFormat) {
        // New format: /chat/:merchantId/:sessionId
        await initializeNewFormat();
      } else {
        // Old format: /chat/:merchantSlug
        await initializeOldFormat();
      }
      setIsInitializing(false);
    };
    init();
  }, [merchantId, merchantSlug, initialSessionId]);

  // Initialize using new format (merchantId/sessionId)
  const initializeNewFormat = async () => {
    try {
      if (initialSessionId) {
        // Load existing session with chat history
        const response = await fetch(`${API_BASE_URL}/api/chat/${merchantId}/${initialSessionId}`);
        const data = await response.json();
        
        if (data.success) {
          setMerchantData(data.data.merchant);
          setSessionId(data.data.sessionId);
          setMcpTools(data.data.mcpTools || []);
          
          // Load chat history
          if (data.data.chatHistory && data.data.chatHistory.length > 0) {
            const formattedHistory = data.data.chatHistory.map(chat => ({
              id: chat.id,
              type: chat.type,
              text: chat.text,
              timestamp: new Date(chat.timestamp),
              toolsUsed: chat.toolsUsed,
              tools: chat.tools,
              toolResults: chat.toolResults
            }));
            setMessages(formattedHistory);
          } else {
            // No history, add welcome message
            addWelcomeMessage(data.data.merchant);
          }
        } else {
          console.error('Failed to load session:', data.error);
          // Create new session if specified session not found
          await createNewSession();
        }
      } else {
        // No sessionId provided, create new session
        await createNewSession();
      }
      
      // Load cart
      const savedCart = localStorage.getItem(`cart_${cacheKey}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to initialize new format:', error);
    }
  };

  // Create a new session and redirect
  const createNewSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/${merchantId}/new`);
      const data = await response.json();
      
      if (data.success) {
        setMerchantData(data.data.merchant);
        setSessionId(data.data.sessionId);
        
        // Update URL to include sessionId (without page reload)
        const newUrl = `/chat/${merchantId}/${data.data.sessionId}`;
        window.history.replaceState({}, '', newUrl);
        
        // Add welcome message
        addWelcomeMessage(data.data.merchant);
        
        // Fetch MCP tools
        await fetchMcpToolsById(merchantId);
      }
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  // Initialize using old format (merchantSlug)
  const initializeOldFormat = async () => {
    // Generate or retrieve session ID from localStorage (old behavior)
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

      // Fetch merchant data and MCP tools
    await fetchMerchantDataBySlug();
    await fetchMcpToolsBySlug();
  };

  // Add welcome message
  const addWelcomeMessage = (merchant) => {
    const welcomeMsg = merchant?.welcomeMessage || 
      `Hi! I'm ${merchant?.displayName || merchant?.name}'s AI assistant. How can I help you today?`;
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      text: welcomeMsg,
      timestamp: new Date()
    }]);
  };

  // Fetch MCP tools by merchant ID
  const fetchMcpToolsById = async (mId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/${mId}/tools`);
      const data = await response.json();
      if (data.success && data.tools) {
        setMcpTools(data.tools);
      }
    } catch (error) {
      console.error('Failed to fetch MCP tools:', error);
    }
  };

  // Fetch MCP tools by slug (old format)
  const fetchMcpToolsBySlug = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mcp/merchants/${merchantSlug}/tools`);
      const data = await response.json();
      if (data.success && data.tools) {
        setMcpTools(data.tools);
      }
    } catch (error) {
      console.error('Failed to fetch MCP tools:', error);
    }
  };

  // Save cart to localStorage
  useEffect(() => {
    if (cacheKey) {
      localStorage.setItem(`cart_${cacheKey}`, JSON.stringify(cart));
    }
  }, [cart, cacheKey]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch merchant data by slug (old format)
  const fetchMerchantDataBySlug = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant/public/${merchantSlug}`);
      const data = await response.json();
      if (data.success) {
        setMerchantData(data.data);
        addWelcomeMessage(data.data);
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
      // Use appropriate endpoint based on format
      let apiUrl;
      let requestBody;
      
      if (isNewFormat && sessionId) {
        // New format: /chat/:merchantId/:sessionId
        apiUrl = `${API_BASE_URL}/api/chat/${merchantId}/${sessionId}`;
        requestBody = { message: query };
      } else {
        // Old format: /chat/public/:merchantSlug
        apiUrl = `${API_BASE_URL}/api/chat/public/${merchantSlug}`;
        requestBody = { message: query, sessionId: sessionId };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        // Include AI response and all tool results for dynamic rendering
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          text: data.data.response,
          timestamp: new Date(),
          toolsUsed: data.data.toolsUsed,
          tools: data.data.tools || [],
          toolResult: data.data.toolResult, // For backward compatibility
          toolResults: data.data.toolResults // All tool results with images, products, etc.
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Update sessionId if returned
        if (data.data.sessionId && !sessionId) {
          setSessionId(data.data.sessionId);
          
          // Update URL to include sessionId for shareable link
          if (!isNewFormat && data.data.merchantId) {
            // For old format: update URL from /chat/:slug to /chat/:merchantId/:sessionId
            const newUrl = `/chat/${data.data.merchantId}/${data.data.sessionId}`;
            window.history.replaceState({}, '', newUrl);
          }
        }
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
          <p className="text-white text-lg">Loading {isNewFormat ? `merchant #${merchantId}` : merchantSlug}...</p>
          {sessionId && <p className="text-gray-400 text-sm mt-2">Session: #{sessionId}</p>}
        </div>
      </div>
    );
  }

  // Dynamic colors from merchant settings
  const primaryColor = merchantData.dynamicSettings?.primaryColor || '#3B82F6';
  const secondaryColor = merchantData.dynamicSettings?.secondaryColor || '#60A5FA';
  const accentColor = merchantData.dynamicSettings?.accentColor || '#F472B6';

  // Generate darker versions for background
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  };
  
  const primary = hexToRgb(primaryColor);
  const secondary = hexToRgb(secondaryColor);

  return (
    <div 
      className="flex h-screen" 
      style={{ 
        background: `linear-gradient(135deg, 
          rgb(${Math.floor(primary.r * 0.1)}, ${Math.floor(primary.g * 0.1)}, ${Math.floor(primary.b * 0.15)}) 0%, 
          rgb(${Math.floor(secondary.r * 0.1)}, ${Math.floor(secondary.g * 0.1)}, ${Math.floor(secondary.b * 0.15)}) 50%, 
          rgb(${Math.floor(primary.r * 0.08)}, ${Math.floor(primary.g * 0.12)}, ${Math.floor(primary.b * 0.2)}) 100%)` 
      }}
    >
      {/* Sidebar - Chat History */}
      <div 
        className="w-72 border-r flex flex-col" 
        style={{ 
          background: `rgba(${primary.r * 0.1}, ${primary.g * 0.1}, ${primary.b * 0.1}, 0.5)`,
          borderColor: `${primaryColor}20`
        }}
      >
        {/* Brand Header */}
        <div className="p-4 border-b" style={{ borderColor: `${primaryColor}30` }}>
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

          {/* MCP Tools Panel */}
          <div className="mt-6">
            <button 
              onClick={() => setShowMcpPanel(!showMcpPanel)}
              className="w-full flex items-center justify-between text-gray-400 text-xs uppercase tracking-wider mb-3 hover:text-gray-300"
            >
              <span className="flex items-center gap-2">
                <Wrench size={12} />
                MCP Tools ({mcpTools.length})
              </span>
              <ChevronRight size={14} className={`transition-transform ${showMcpPanel ? 'rotate-90' : ''}`} />
            </button>
            
            {showMcpPanel && mcpTools.length > 0 && (
              <div className="space-y-2">
                {mcpTools.map((tool, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={12} style={{ color: primaryColor }} />
                      <span className="text-white text-xs font-semibold">{tool.name}</span>
                    </div>
                    <p className="text-gray-500 text-xs line-clamp-2">{tool.description}</p>
                    {tool.inputSchema?.properties && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.keys(tool.inputSchema.properties).slice(0, 3).map((param, pIdx) => (
                          <span 
                            key={pIdx}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-gray-400"
                          >
                            {param}
                          </span>
                        ))}
                        {Object.keys(tool.inputSchema.properties).length > 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-gray-400">
                            +{Object.keys(tool.inputSchema.properties).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showMcpPanel && mcpTools.length === 0 && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <Info size={16} className="mx-auto mb-2 text-gray-500" />
                <p className="text-gray-500 text-xs">No tools configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Powered By */}
        <div className="p-4 border-t" style={{ borderColor: `${primaryColor}30` }}>
          <p className="text-gray-500 text-xs text-center">
            Powered by <span style={{ color: primaryColor }}>AI Marketplace</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header 
          className="border-b backdrop-blur-md"
          style={{ 
            background: `linear-gradient(90deg, ${primaryColor}20, ${secondaryColor}15)`,
            borderColor: `${primaryColor}30`
          }}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
                <div>
                <h1 className="text-lg font-semibold text-white">Shopping Assistant</h1>
                  {isNewFormat && sessionId && (
                    <p className="text-xs text-gray-400">Session #{sessionId}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* New Chat Button */}
                {isNewFormat && (
                  <button
                    onClick={() => {
                      // Navigate to create a new session
                      window.location.href = `/chat/${merchantId}`;
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors hover:bg-white/10 border border-white/20"
                  >
                    + New Chat
                  </button>
                )}

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
                      {/* Show tools used badge */}
                      {message.type === 'assistant' && message.toolsUsed && message.tools?.length > 0 && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                          <Zap size={12} style={{ color: accentColor }} />
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Tools Used:</span>
                          {message.tools.map((tool, tIdx) => (
                            <span 
                              key={tIdx}
                              className="px-2 py-0.5 text-[10px] rounded-full font-medium flex items-center gap-1"
                              style={{ background: `${primaryColor}30`, color: primaryColor }}
                            >
                              <CheckCircle size={10} />
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      
                      {/* Dynamic Tool Results Rendering - Multiple Tools */}
                      {message.toolResults && message.toolResults.length > 0 && (
                        <div>
                          {message.toolResults.map((result, idx) => (
                            <ToolResultRenderer 
                              key={idx}
                              result={result}
                              toolName={result.tool || `tool-${idx}`}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Dynamic Tool Result Rendering - Single Tool (backward compatibility) */}
                      {!message.toolResults && message.toolResult && (
                        <ToolResultRenderer 
                          result={{ data: message.toolResult, success: true }}
                          toolName="result"
                        />
                      )}
                      
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

            {/* Products are now displayed by the LLM in the chat response */}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div 
          className="border-t p-4" 
          style={{ 
            background: `rgba(${primary.r * 0.05}, ${primary.g * 0.05}, ${primary.b * 0.1}, 0.8)`,
            borderColor: `${primaryColor}30`
          }}
        >
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Search ${merchantData.displayName || merchantData.name} products...`}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                style={{ 
                  borderColor: `${primaryColor}40`,
                  '--tw-ring-color': primaryColor
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-3 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium hover:shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 4px 15px ${primaryColor}40`
                }}
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
        <div 
          className="w-96 border-l flex flex-col" 
          style={{ 
            background: `rgba(${primary.r * 0.05}, ${primary.g * 0.05}, ${primary.b * 0.08}, 0.9)`,
            borderColor: `${primaryColor}30`
          }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: `${primaryColor}30` }}>
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
            <div className="p-4 border-t" style={{ borderColor: `${primaryColor}30` }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Total</span>
                <span className="text-xl font-semibold" style={{ color: primaryColor }}>₹{cartTotal.toLocaleString()}</span>
              </div>
              <button
                onClick={() => setInputMessage('Proceed to checkout')}
                className="w-full py-3 text-white rounded-xl font-medium transition-all hover:shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 4px 15px ${primaryColor}40`
                }}
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
