import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Key, 
  TestTube, 
  Save, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Loader,
  Eye,
  EyeOff
} from 'lucide-react';

const AISettings = ({ merchantId }) => {
  const [providers, setProviders] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [formData, setFormData] = useState({
    provider: '',
    apiKey: '',
    model: '',
    config: {
      temperature: 0.7,
      maxTokens: 2048
    }
  });

  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, [merchantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load available providers
      const providersRes = await fetch('http://localhost:3001/api/settings/ai/providers');
      const providersData = await providersRes.json();
      
      if (providersData.success) {
        setProviders(providersData.providers);
      }

      // Load merchant configurations
      const configsRes = await fetch(`http://localhost:3001/api/settings/merchants/${merchantId}/ai`);
      const configsData = await configsRes.json();
      
      if (configsData.success) {
        setConfigurations(configsData.configurations);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load AI settings');
      setLoading(false);
    }
  };

  const handleProviderChange = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    setFormData({
      ...formData,
      provider: providerId,
      model: provider?.models[0]?.id || '',
      apiKey: '',
      config: {
        temperature: 0.7,
        maxTokens: 2048
      }
    });
    setTestResult(null);
  };

  const handleTestApiKey = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setError(null);

      const response = await fetch('http://localhost:3001/api/settings/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: formData.provider,
          apiKey: formData.apiKey,
          model: formData.model
        })
      });

      const data = await response.json();
      setTestResult(data);
      
      if (!data.success) {
        setError(data.message);
      }

      setTesting(false);
    } catch (err) {
      console.error('Test failed:', err);
      setError('Failed to test API key');
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`http://localhost:3001/api/settings/merchants/${merchantId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('AI configuration saved successfully!');
        setFormData({
          provider: '',
          apiKey: '',
          model: '',
          config: {
            temperature: 0.7,
            maxTokens: 2048
          }
        });
        setTestResult(null);
        await loadData();
      } else {
        setError(data.error || 'Failed to save configuration');
      }

      setSaving(false);
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save AI configuration');
      setSaving(false);
    }
  };

  const handleActivate = async (configId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/settings/merchants/${merchantId}/ai/${configId}/activate`,
        { method: 'PUT' }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('AI configuration activated!');
        await loadData();
      } else {
        setError(data.error || 'Failed to activate configuration');
      }
    } catch (err) {
      console.error('Activation failed:', err);
      setError('Failed to activate AI configuration');
    }
  };

  const handleDelete = async (configId) => {
    if (!confirm('Are you sure you want to delete this AI configuration?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/settings/merchants/${merchantId}/ai/${configId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess('AI configuration deleted!');
        await loadData();
      } else {
        setError(data.error || 'Failed to delete configuration');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete AI configuration');
    }
  };

  const selectedProvider = providers.find(p => p.id === formData.provider);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="w-8 h-8 text-blue-600" />
          AI Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure AI providers for your chat interface
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Success</p>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-5 h-5 text-green-600" />
          </button>
        </div>
      )}

      {/* New Configuration Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New AI Provider</h2>
        
        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a provider...</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          {selectedProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {selectedProvider.models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* API Key */}
          {formData.provider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Enter your API key..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Advanced Config */}
          {formData.provider && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.config.temperature}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, temperature: parseFloat(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="4096"
                  value={formData.config.maxTokens}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, maxTokens: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {testResult.message}
                  </p>
                  {testResult.response && (
                    <p className="text-sm text-gray-600 mt-1">
                      Test response: {testResult.response}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {formData.provider && formData.apiKey && (
            <div className="flex gap-3">
              <button
                onClick={handleTestApiKey}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
              >
                {testing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Test API Key
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving || !testResult?.success}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Configuration
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Existing Configurations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Configured AI Providers</h2>
        
        {configurations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No AI providers configured yet. Add one above to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {configurations.map(config => {
              const provider = providers.find(p => p.id === config.provider);
              const model = provider?.models.find(m => m.id === config.model);
              
              return (
                <div
                  key={config.id}
                  className={`p-4 border-2 rounded-lg ${config.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{provider?.name}</h3>
                        {config.isActive && (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Model:</span> {model?.name}</p>
                        <p><span className="font-medium">API Key:</span> {config.apiKey}</p>
                        {config.config && (
                          <p>
                            <span className="font-medium">Config:</span> 
                            {' '}Temperature: {config.config.temperature || 0.7}, 
                            Max Tokens: {config.config.maxTokens || 2048}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {!config.isActive && (
                        <button
                          onClick={() => handleActivate(config.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                          title="Activate this configuration"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        title="Delete this configuration"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISettings;

