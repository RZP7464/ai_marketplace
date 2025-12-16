import React, { useState, useEffect } from 'react';
import { Settings, Bot, Link2, Zap, Check, X, Copy, ExternalLink, Loader } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SettingsPage = ({ merchantId = 6 }) => {
  const [settings, setSettings] = useState(null);
  const [mcpConfig, setMcpConfig] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    loadAllSettings();
  }, [merchantId]);

  const loadAllSettings = async () => {
    try {
      setIsLoading(true);

      // Load merchant settings
      const settingsRes = await fetch(`${API_BASE_URL}/api/settings/merchants/${merchantId}`);
      const settingsData = await settingsRes.json();
      
      if (settingsData.success) {
        setSettings(settingsData.settings);
      }

      // Load MCP configuration
      const mcpRes = await fetch(`${API_BASE_URL}/api/settings/merchants/${merchantId}/mcp`);
      const mcpData = await mcpRes.json();
      
      if (mcpData.success) {
        setMcpConfig(mcpData.mcp);
      }

      // Load AI configuration
      const aiRes = await fetch(`${API_BASE_URL}/api/settings/ai`);
      const aiData = await aiRes.json();
      
      if (aiData.success) {
        setAiConfig(aiData.ai);
      }

    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleColorChange = async (color) => {
    try {
      setIsSaving(true);

      const response = await fetch(`${API_BASE_URL}/api/settings/merchants/${merchantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, color })
      });

      const data = await response.json();

      if (data.success) {
        setSettings({ ...settings, color });
      }
    } catch (error) {
      console.error('Error saving color:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          </div>
          <p className="text-gray-600">Manage your AI and MCP configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MCP Configuration Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Link2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">MCP Server</h2>
                <p className="text-sm text-gray-600">Model Context Protocol Configuration</p>
              </div>
            </div>

            {mcpConfig && (
              <div className="space-y-4">
                {/* Merchant Info */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Merchant</p>
                  <p className="text-lg font-bold text-gray-900">{mcpConfig.merchant.name}</p>
                  <p className="text-xs text-gray-600">ID: {mcpConfig.merchant.id} • Slug: {mcpConfig.merchant.slug}</p>
                </div>

                {/* Tools Count */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-700">Available Tools</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{mcpConfig.toolsCount}</span>
                </div>

                {/* Endpoints */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Endpoints</p>
                  
                  {[
                    { label: 'Base URL', value: mcpConfig.fullUrl },
                    { label: 'Tools', value: `${API_BASE_URL}${mcpConfig.toolsEndpoint}` },
                    { label: 'RPC', value: `${API_BASE_URL}${mcpConfig.rpcEndpoint}` },
                    { label: 'Info', value: `${API_BASE_URL}${mcpConfig.infoEndpoint}` }
                  ].map((endpoint) => (
                    <div key={endpoint.label} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600">{endpoint.label}</p>
                        <p className="text-sm font-mono text-gray-800 break-all">{endpoint.value}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(endpoint.value, endpoint.label)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Copy URL"
                      >
                        {copySuccess === endpoint.label ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <a
                        href={endpoint.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </a>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">MCP Server Active</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Configuration Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">AI Configuration</h2>
                <p className="text-sm text-gray-600">Gemini AI Settings</p>
              </div>
            </div>

            {aiConfig && (
              <div className="space-y-4">
                {/* Provider Info */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Provider</p>
                  <p className="text-lg font-bold text-gray-900">Google Gemini AI</p>
                  <p className="text-xs text-gray-600">Model: {aiConfig.model}</p>
                </div>

                {/* API Key Status */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  aiConfig.apiKeyConfigured ? 'bg-green-50' : 'bg-yellow-50'
                }`}>
                  {aiConfig.apiKeyConfigured ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">API Key Configured</p>
                        <p className="text-xs text-green-600">AIzaSy...nLA (Hidden for security)</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-semibold text-yellow-800">API Key Not Configured</p>
                        <p className="text-xs text-yellow-600">Add GEMINI_API_KEY to .env file</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Available Models */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Available Models</p>
                  <div className="space-y-2">
                    {aiConfig.availableModels.map((model) => (
                      <div
                        key={model.id}
                        className={`p-3 rounded-lg border-2 ${
                          model.id === aiConfig.model
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{model.name}</p>
                            <p className="text-xs text-gray-600">{model.id}</p>
                          </div>
                          {model.id === aiConfig.model && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Enabled Features</p>
                  {[
                    'Function Calling (MCP Tools)',
                    'Conversation History',
                    'Context Awareness',
                    'Multi-turn Chat'
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 p-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Settings Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Theme Settings</h2>
                <p className="text-sm text-gray-600">Customize your chat interface</p>
              </div>
            </div>

            {settings && (
              <div className="space-y-4">
                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.color || '#3B82F6'}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-300"
                      disabled={isSaving}
                    />
                    <div className="flex-1">
                      <p className="font-mono text-lg text-gray-800">{settings.color || '#3B82F6'}</p>
                      <p className="text-xs text-gray-600">Click to change</p>
                    </div>
                  </div>
                </div>

                {/* Quick Color Presets */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Quick Presets</p>
                  <div className="grid grid-cols-6 gap-2">
                    {['#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#10B981', '#F59E0B'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className="w-full aspect-square rounded-lg border-2 hover:scale-110 transition-transform"
                        style={{ 
                          backgroundColor: color,
                          borderColor: settings.color === color ? '#000' : 'transparent'
                        }}
                        disabled={isSaving}
                      />
                    ))}
                  </div>
                </div>

                {isSaving && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">Saving...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
                <p className="text-sm text-gray-600">Test and manage your setup</p>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={`${API_BASE_URL}/api/mcp/${merchantId}/tools`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
              >
                <div>
                  <p className="font-semibold text-gray-800">View Available Tools</p>
                  <p className="text-xs text-gray-600">See all MCP tools</p>
                </div>
                <ExternalLink className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href={`${API_BASE_URL}/api/mcp/${merchantId}/info`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
              >
                <div>
                  <p className="font-semibold text-gray-800">MCP Server Info</p>
                  <p className="text-xs text-gray-600">View server details</p>
                </div>
                <ExternalLink className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </a>

              <button
                onClick={loadAllSettings}
                className="w-full flex items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
              >
                <Settings className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-800">Refresh Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

