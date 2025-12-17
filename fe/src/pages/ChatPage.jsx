import React, { useState, useEffect } from 'react';
import MCPChatInterface from '../components/MCPChatInterface';
import { Store, Loader } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const ChatPage = () => {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      setIsLoading(true);
      
      // For now, we'll use a test merchant
      // In production, this would fetch from an API
      const testMerchants = [
        { id: 6, name: 'MCP Test Store', slug: 'mcp-test-store' },
        { id: 1, name: 'Demo Store', slug: 'demo-store' },
      ];

      setMerchants(testMerchants);
      
      // Auto-select first merchant
      if (testMerchants.length > 0) {
        setSelectedMerchant(testMerchants[0]);
      }
    } catch (error) {
      console.error('Error loading merchants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading merchants...</p>
        </div>
      </div>
    );
  }

  if (!selectedMerchant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center max-w-md">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Merchants Available</h2>
          <p className="text-gray-600">
            Please set up a merchant first to use the chat interface.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Merchant Selector (if multiple merchants) */}
      {merchants.length > 1 && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Merchant:</label>
            <select
              value={selectedMerchant.id}
              onChange={(e) => {
                const merchant = merchants.find(m => m.id === parseInt(e.target.value));
                setSelectedMerchant(merchant);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name} (ID: {merchant.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <MCPChatInterface
        key={selectedMerchant.id} // Re-mount on merchant change
        merchantId={selectedMerchant.id}
        merchantName={selectedMerchant.name}
      />
    </div>
  );
};

export default ChatPage;

