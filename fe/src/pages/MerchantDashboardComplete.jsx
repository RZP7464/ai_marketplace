import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function MerchantDashboardComplete() {
  const [loading, setLoading] = useState(true);
  const [merchantData, setMerchantData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadMerchantData();
  }, []);

  const loadMerchantData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMerchant();
      
      if (response.success) {
        setMerchantData(response.data);
      } else {
        setError(response.error || 'Failed to load merchant data');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 text-xl font-bold mb-2">Error</h2>
          <p className="text-red-300">{error}</p>
          <button
            onClick={loadMerchantData}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!merchantData) {
    return null;
  }

  const merchant = merchantData;
  const dynamicSettings = merchant.dynamicSettings || {};
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {merchant.logo ? (
                <img src={merchant.logo} alt="Logo" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {merchant.displayName?.charAt(0) || merchant.name?.charAt(0) || 'M'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{merchant.displayName || merchant.name}</h1>
                <p className="text-gray-400 text-sm">{merchant.slug}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 border-b border-white/10">
          {['overview', 'brand', 'apis', 'settings', 'mcp'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Merchant Info Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Merchant Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">ID</p>
                  <p className="text-white font-mono">{merchant.id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{merchant.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Type</p>
                  <p className="text-white capitalize">{merchant.type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Created</p>
                  <p className="text-white">{new Date(merchant.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Brand Info Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Brand Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Tagline</p>
                  <p className="text-white">{merchant.tagline || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Welcome Message</p>
                  <p className="text-white">{merchant.welcomeMessage || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Categories</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {merchant.categories?.map((cat, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                        {cat}
                      </span>
                    )) || <span className="text-gray-500">None</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Colors Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Theme Colors</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Primary</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div 
                      className="w-8 h-8 rounded border border-white/20"
                      style={{ backgroundColor: dynamicSettings.primaryColor || '#3B82F6' }}
                    ></div>
                    <p className="text-white font-mono">{dynamicSettings.primaryColor || '#3B82F6'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Secondary</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div 
                      className="w-8 h-8 rounded border border-white/20"
                      style={{ backgroundColor: dynamicSettings.secondaryColor || '#60A5FA' }}
                    ></div>
                    <p className="text-white font-mono">{dynamicSettings.secondaryColor || '#60A5FA'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Accent</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div 
                      className="w-8 h-8 rounded border border-white/20"
                      style={{ backgroundColor: dynamicSettings.accentColor || '#F472B6' }}
                    ></div>
                    <p className="text-white font-mono">{dynamicSettings.accentColor || '#F472B6'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'brand' && (
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Brand Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Display Name</label>
                <p className="text-white text-lg">{merchant.displayName || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Tagline</label>
                <p className="text-white text-lg">{merchant.tagline || 'Not set'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Welcome Message</label>
                <p className="text-white text-lg">{merchant.welcomeMessage || 'Not set'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Description</label>
                <p className="text-white">{merchant.description || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Website</label>
                <p className="text-white">{merchant.website || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Phone</label>
                <p className="text-white">{merchant.phone || 'Not set'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Address</label>
                <p className="text-white">{merchant.address || 'Not set'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apis' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">API Configuration</h2>
              <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                Add API
              </button>
            </div>
            
            {merchant.apis && merchant.apis.length > 0 ? (
              <div className="grid gap-4">
                {merchant.apis.map((api, idx) => (
                  <div key={idx} className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{api.payload?.name || api.apiType}</h3>
                        <p className="text-gray-400 text-sm">{api.payload?.description || 'No description'}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm font-medium">
                        {api.payload?.method || 'GET'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-400 text-xs">URL</p>
                        <p className="text-white font-mono text-sm break-all">{api.payload?.url}</p>
                      </div>
                      {api.payload?.headers && api.payload.headers.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-xs">Headers ({api.payload.headers.length})</p>
                          <div className="mt-1 space-y-1">
                            {api.payload.headers.slice(0, 3).map((header, i) => (
                              <p key={i} className="text-white text-sm font-mono">
                                {header.key}: {header.value.substring(0, 50)}{header.value.length > 50 ? '...' : ''}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      {api.payload?.params && api.payload.params.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-xs">Parameters ({api.payload.params.length})</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {api.payload.params.map((param, i) => (
                              <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                                {param.key}: {param.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
                <p className="text-gray-400">No APIs configured yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Dynamic Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(dynamicSettings).map(([key, value]) => (
                    key !== 'id' && key !== 'merchantId' && key !== 'createdAt' && key !== 'updatedAt' && (
                      <div key={key} className="p-4 bg-white/5 rounded-lg">
                        <p className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-white mt-1">{value || 'Not set'}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mcp' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">MCP (Model Context Protocol)</h2>
              <p className="text-gray-400">Your APIs are automatically exposed as MCP tools for AI integration.</p>
            </div>

            <div className="grid gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">MCP Endpoints</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Server Info</p>
                    <code className="text-purple-300 font-mono text-sm break-all">
                      http://localhost:3001/api/mcp/merchants/{merchant.id}/info
                    </code>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Tools List</p>
                    <code className="text-purple-300 font-mono text-sm break-all">
                      http://localhost:3001/api/mcp/merchants/{merchant.id}/tools
                    </code>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">SSE Stream</p>
                    <code className="text-purple-300 font-mono text-sm break-all">
                      http://localhost:3001/api/mcp/merchants/{merchant.id}/stream
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Test MCP</h3>
                <button
                  onClick={() => window.open(`http://localhost:3001/api/mcp/merchants/${merchant.id}/tools`, '_blank')}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  Open Tools Endpoint
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MerchantDashboardComplete;

