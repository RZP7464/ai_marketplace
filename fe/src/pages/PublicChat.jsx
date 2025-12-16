import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';

function PublicChat({ merchantSlug }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [merchantData, setMerchantData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Generate or retrieve session ID
    let sid = localStorage.getItem(`chat_session_${merchantSlug}`);
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(`chat_session_${merchantSlug}`, sid);
    }
    setSessionId(sid);

    // Fetch merchant data
    fetchMerchantData();
  }, [merchantSlug]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMerchantData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/merchant/public/${merchantSlug}`);
      const data = await response.json();
      if (data.success) {
        setMerchantData(data.data);
        // Add welcome message
        setMessages([{
          id: 'welcome',
          type: 'assistant',
          text: data.data.welcomeMessage || `Hi! I'm ${data.data.displayName || data.data.name}'s AI assistant. How can I help you today?`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch merchant data:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await fetch(`http://localhost:3001/api/chat/public/${merchantSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          text: data.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!merchantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading chat...</p>
        </div>
      </div>
    );
  }

  const primaryColor = merchantData.dynamicSettings?.primaryColor || '#3B82F6';
  const secondaryColor = merchantData.dynamicSettings?.secondaryColor || '#60A5FA';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Header */}
      <header 
        className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {merchantData.logo ? (
            <img 
              src={merchantData.logo} 
              alt={merchantData.name} 
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div 
              className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              {merchantData.displayName?.charAt(0) || merchantData.name?.charAt(0) || 'A'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">
              {merchantData.displayName || merchantData.name}
            </h1>
            {merchantData.tagline && (
              <p className="text-gray-400 text-sm">{merchantData.tagline}</p>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <Bot size={18} />
                </div>
              )}
              
              <div
                className={`max-w-[70%] rounded-2xl p-4 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-white/10 backdrop-blur-md text-white border border-white/10'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <Bot size={18} />
              </div>
              <div className="bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  <span className="text-sm">Typing...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black/30 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={20} />
              Send
            </button>
          </form>
          
          <p className="text-gray-500 text-xs text-center mt-2">
            Powered by AI • {merchantData.displayName || merchantData.name}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicChat;

