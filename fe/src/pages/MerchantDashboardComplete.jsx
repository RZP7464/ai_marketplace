import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
          <>
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

          {/* Shareable Chat URL Section */}
          <div className="mt-6">
            <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
                    <span className="mr-2">💬</span> Share Your AI Chat
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Share this link with your customers to let them chat with your AI-powered assistant
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Public Chat URL */}
                <div>
                  <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wide">Public Chat URL</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/30 rounded-lg p-4 border border-white/10">
                      <p className="text-green-300 font-mono text-sm break-all">
                        {window.location.origin}/chat/{merchant.slug}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/chat/${merchant.slug}`);
                        const btn = event.target.closest('button');
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> Copied!';
                        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                      }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Embed Code */}
                <div>
                  <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wide">Embed Code (for your website)</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/30 rounded-lg p-4 border border-white/10 overflow-x-auto">
                      <code className="text-purple-300 font-mono text-xs break-all whitespace-pre-wrap">
                        {`<iframe src="${window.location.origin}/chat/${merchant.slug}" width="100%" height="600" frameborder="0"></iframe>`}
                      </code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`<iframe src="${window.location.origin}/chat/${merchant.slug}" width="100%" height="600" frameborder="0"></iframe>`);
                        const btn = event.target.closest('button');
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> Copied!';
                        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                      }}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Copy Code
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 pt-2">
                  <a
                    href={`/chat/${merchant.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Preview Chat
                  </a>
                  <button
                    onClick={() => {
                      const qrData = `${window.location.origin}/chat/${merchant.slug}`;
                      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`, '_blank');
                    }}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Generate QR Code
                  </button>
                </div>
              </div>

              {/* Stats Preview */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">{merchant.apis?.length || 0}</p>
                    <p className="text-gray-400 text-xs">API Tools</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">Active</p>
                    <p className="text-gray-400 text-xs">Status</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">AI</p>
                    <p className="text-gray-400 text-xs">Powered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings CTA */}
          <div className="mt-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">Advanced Settings</h3>
                    <p className="text-gray-400 text-sm">
                      Configure AI models, MCP endpoints, theme customization, and more
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/settings')
                    window.dispatchEvent(new PopStateEvent('popstate'))
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <span>Open Settings</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          </>
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
          <div className="space-y-6">
            {/* AI Provider Settings */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <span className="mr-2">🤖</span> AI Provider Settings
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">Choose your AI provider for chat</p>
                </div>
              </div>

              {/* AI Provider Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gemini Card */}
                <div className={`p-5 rounded-lg border-2 transition-all cursor-pointer ${
                  (merchant.aiConfigurations?.[0]?.provider || 'gemini') === 'gemini'
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-white/5 border-white/20 hover:border-white/40'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                        <span className="text-xl">💎</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Google Gemini</h4>
                        <p className="text-gray-400 text-xs">gemini-2.5-pro</p>
                      </div>
                    </div>
                    {(merchant.aiConfigurations?.[0]?.provider || 'gemini') === 'gemini' && (
                      <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">Active</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    Free tier available • Best for general use • Fast responses
                  </p>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-gray-500 text-xs">
                      ✅ Default provider (pre-configured)
                    </p>
                  </div>
                </div>

                {/* OpenAI Card */}
                <div className={`p-5 rounded-lg border-2 transition-all cursor-pointer ${
                  merchant.aiConfigurations?.[0]?.provider === 'openai'
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-white/5 border-white/20 hover:border-white/40'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-xl">🧠</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">OpenAI</h4>
                        <p className="text-gray-400 text-xs">GPT-4 / GPT-3.5</p>
                      </div>
                    </div>
                    {merchant.aiConfigurations?.[0]?.provider === 'openai' && (
                      <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">Active</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    Premium quality • Advanced reasoning • Tool calling
                  </p>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-gray-500 text-xs">
                      🔑 Requires your own API key
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Config Info */}
              <div className="mt-6 p-4 bg-black/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400">●</span>
                  <span className="text-white font-medium">Current Configuration</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Provider</p>
                    <p className="text-white font-mono">{merchant.aiConfigurations?.[0]?.provider || 'gemini'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Model</p>
                    <p className="text-white font-mono">{merchant.aiConfigurations?.[0]?.model || 'gemini-2.5-pro'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <p className="text-green-400">Active</p>
                  </div>
                  <div>
                    <p className="text-gray-400">API Key</p>
                    <p className="text-white font-mono">••••••••••</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-xs mt-4">
                💡 Gemini is pre-configured and ready to use. To switch to OpenAI, add your API key in AI Settings.
              </p>
            </div>

            {/* Dynamic Settings */}
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10">
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
                      {API_BASE_URL}/api/mcp/merchants/{merchant.id}/info
                    </code>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Tools List</p>
                    <code className="text-purple-300 font-mono text-sm break-all">
                      {API_BASE_URL}/api/mcp/merchants/{merchant.id}/tools
                    </code>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">SSE Stream</p>
                    <code className="text-purple-300 font-mono text-sm break-all">
                      {API_BASE_URL}/api/mcp/merchants/{merchant.id}/stream
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Test MCP</h3>
                <button
                  onClick={() => window.open(`${API_BASE_URL}/api/mcp/merchants/${merchant.id}/tools`, '_blank')}
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

