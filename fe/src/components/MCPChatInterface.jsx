import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Zap, Loader, RefreshCw, AlertCircle } from 'lucide-react';
import ToolResultRenderer from './ToolResultRenderer';
import { API_BASE_URL } from '../config/api';

const MCPChatInterface = ({ merchantId, merchantName }) => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState([]);
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    if (merchantId) {
      initializeSession();
    }
  }, [merchantId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = async () => {
    try {
      setIsLoading(true);

      // Create new session
      const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId })
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.session.id);
        setMcpEndpoint(data.session.mcpEndpoint);

        // Load available MCP tools
        await loadMCPTools(merchantId);

        // Add welcome message
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Welcome to ${merchantName}! I'm your AI assistant powered by ${data.session.merchant.name}'s MCP server. How can I help you today?`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      setMessages([{
        id: 'error',
        role: 'assistant',
        content: 'Sorry, I encountered an error initializing the chat session. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMCPTools = async (mId) => {
    try {
      // Fetch tools - returns ONLY tools for APIs configured in database
      const response = await fetch(`${API_BASE_URL}/api/mcp/${mId}/tools`);
      const data = await response.json();

      if (data.success) {
        setAvailableTools(data.tools || []);
        
        // Log for debugging
        console.log(`📦 Loaded ${data.tools?.length || 0} tools from configured APIs`);
        if (data.tools?.length === 0) {
          console.warn('⚠️  No tools available. This merchant has not configured any APIs in the database.');
        }
      }
    } catch (error) {
      console.error('Error loading MCP tools:', error);
      setAvailableTools([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || !sessionId) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await fetch(
        `${API_BASE_URL}/api/chat/sessions/${sessionId}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: inputMessage })
        }
      );

      const data = await response.json();

      if (data.success) {
        // Add assistant response
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response.content,
          toolResults: data.response.toolResults,
          timestamp: data.response.timestamp
        }]);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeToolDirectly = async (toolName, args) => {
    if (!sessionId) return;

    setIsLoading(true);

    try {
      // Add system message
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        role: 'system',
        content: `Executing tool: ${toolName}`,
        timestamp: new Date().toISOString()
      }]);

      // Execute tool via MCP
      const response = await fetch(
        `${API_BASE_URL}/api/mcp/${merchantId}/tools/${toolName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args })
        }
      );

      const data = await response.json();

      // Add result message
      setMessages(prev => [...prev, {
        id: `tool-result-${Date.now()}`,
        role: 'assistant',
        content: `Tool "${toolName}" executed successfully!`,
        toolResult: data.result,
        timestamp: new Date().toISOString()
      }]);

      // Save to session
      await fetch(
        `${API_BASE_URL}/api/chat/sessions/${sessionId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'system',
            message: `Tool executed: ${toolName}`
          })
        }
      );
    } catch (error) {
      console.error('Error executing tool:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error executing tool: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = async () => {
    setMessages([]);
    setSessionId(null);
    setAvailableTools([]);
    await initializeSession();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bot className="w-7 h-7 text-blue-600" />
              {merchantName} AI Chat
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-gray-600">
                Session: <span className="font-mono text-blue-600">#{sessionId || 'Initializing...'}</span>
              </p>
              <p className="text-sm text-gray-600">
                MCP: <span className="font-mono text-purple-600">{mcpEndpoint || 'Loading...'}</span>
              </p>
              <p className="text-sm text-gray-600">
                Tools: <span className="font-semibold text-green-600">{availableTools.length}</span>
              </p>
            </div>
          </div>
          <button
            onClick={resetSession}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset Session"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Available Tools Panel */}
      {availableTools.length > 0 ? (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Available Tools (from configured APIs):</span>
            {availableTools.map((tool) => (
              <span
                key={tool.name}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                title={tool.description}
              >
                {tool.name}
              </span>
            ))}
          </div>
        </div>
      ) : sessionId && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              No tools available. This merchant has not configured any APIs in the database. 
              Please configure APIs in the merchant dashboard to enable MCP tools.
            </span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-3 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-500'
                    : message.role === 'system'
                    ? 'bg-yellow-500'
                    : 'bg-purple-500'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className="flex flex-col">
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-100 text-yellow-900'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Tool Results with Dynamic Rendering */}
                  {message.toolResults && message.toolResults.length > 0 && (
                    <div>
                      {message.toolResults.map((result, idx) => (
                        <ToolResultRenderer 
                          key={idx}
                          result={result}
                          toolName={result.tool}
                        />
                      ))}
                    </div>
                  )}

                  {/* Single Tool Result with Dynamic Rendering */}
                  {message.toolResult && (
                    <ToolResultRenderer 
                      result={message.toolResult}
                      toolName="tool"
                    />
                  )}
                </div>

                <span className="text-xs text-gray-500 mt-1 px-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={!sessionId || isLoading}
          />
          <button
            type="submit"
            disabled={!sessionId || isLoading || !inputMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </form>

        {/* Session Info */}
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
          <span>Merchant ID: {merchantId}</span>
          <span>•</span>
          <span>{availableTools.length} tools available</span>
          <span>•</span>
          <span>MCP Server: {mcpEndpoint}</span>
        </div>
      </div>
    </div>
  );
};

export default MCPChatInterface;

