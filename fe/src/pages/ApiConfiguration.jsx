import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, Plus, X, Code, Search, ShoppingCart, CreditCard, MessageSquare, Ticket, Loader2, Terminal, Clipboard, Sparkles } from 'lucide-react'
import apiService from '../services/api'

const API_CONFIGS = [
  { 
    key: 'search_item', 
    label: 'Search Items', 
    icon: Search,
    description: 'API to search and fetch products from your catalog'
  },
  { 
    key: 'add_to_cart', 
    label: 'Add to Cart', 
    icon: ShoppingCart,
    description: 'API to add items to shopping cart'
  },
  { 
    key: 'checkout', 
    label: 'Checkout', 
    icon: CreditCard,
    description: 'API to process checkout and payments'
  },
  { 
    key: 'base_prompt', 
    label: 'Base Prompt', 
    icon: MessageSquare,
    description: 'API for AI assistant base prompt configuration'
  },
  { 
    key: 'coupons', 
    label: 'Coupons', 
    icon: Ticket,
    description: 'API to fetch and validate discount coupons'
  }
]

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const METHOD_COLORS = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-yellow-500',
  DELETE: 'bg-red-500',
  PATCH: 'bg-purple-500'
}

// Parse curl command and extract API configuration
const parseCurlCommand = (curlString) => {
  const config = {
    url: '',
    method: 'GET',
    headers: [],
    params: [],
    body: ''
  }

  // Clean up the curl string - remove line continuations and extra whitespace
  let cleanCurl = curlString
    .replace(/\\\n/g, ' ')
    .replace(/\\\r\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Extract method using -X or --request
  const methodMatch = cleanCurl.match(/(?:-X|--request)\s+['"]?(\w+)['"]?/i)
  if (methodMatch) {
    config.method = methodMatch[1].toUpperCase()
  } else if (cleanCurl.includes('--data') || cleanCurl.includes('-d ')) {
    // If there's data but no explicit method, it's POST
    config.method = 'POST'
  }

  // Extract URL - handle both quoted and unquoted URLs
  const urlPatterns = [
    /curl\s+(?:.*?\s+)?['"]?(https?:\/\/[^\s'"]+)['"]?/i,
    /['"]?(https?:\/\/[^\s'"]+)['"]?/i
  ]
  
  for (const pattern of urlPatterns) {
    const urlMatch = cleanCurl.match(pattern)
    if (urlMatch) {
      let fullUrl = urlMatch[1]
      
      // Parse URL to extract query params
      try {
        const urlObj = new URL(fullUrl)
        config.url = `${urlObj.origin}${urlObj.pathname}`
        
        // Extract query parameters
        urlObj.searchParams.forEach((value, key) => {
          config.params.push({ key, value })
        })
      } catch {
        config.url = fullUrl
      }
      break
    }
  }

  // Extract headers using -H or --header
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/gi
  let headerMatch
  while ((headerMatch = headerRegex.exec(cleanCurl)) !== null) {
    const headerStr = headerMatch[1]
    const colonIndex = headerStr.indexOf(':')
    if (colonIndex > 0) {
      const key = headerStr.substring(0, colonIndex).trim()
      const value = headerStr.substring(colonIndex + 1).trim()
      config.headers.push({ key, value })
    }
  }

  // Extract body data using -d, --data, --data-raw, or --data-binary
  const dataPatterns = [
    /(?:--data-raw|--data-binary|--data|-d)\s+'([^']+)'/i,
    /(?:--data-raw|--data-binary|--data|-d)\s+"([^"]+)"/i,
    /(?:--data-raw|--data-binary|--data|-d)\s+(\{[^}]+\})/i,
    /(?:--data-raw|--data-binary|--data|-d)\s+'({[\s\S]*?})'/i,
    /(?:--data-raw|--data-binary|--data|-d)\s+"({[\s\S]*?})"/i
  ]

  for (const pattern of dataPatterns) {
    const dataMatch = cleanCurl.match(pattern)
    if (dataMatch) {
      let bodyData = dataMatch[1]
      // Try to pretty print JSON
      try {
        const parsed = JSON.parse(bodyData)
        config.body = JSON.stringify(parsed, null, 2)
      } catch {
        config.body = bodyData
      }
      break
    }
  }

  // Ensure at least one empty header/param if none found
  if (config.headers.length === 0) {
    config.headers.push({ key: '', value: '' })
  }
  if (config.params.length === 0) {
    config.params.push({ key: '', value: '' })
  }

  return config
}

function ApiConfiguration({ onNext, onBack, brandData }) {
  const [currentApiIndex, setCurrentApiIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiConfigs, setApiConfigs] = useState(
    API_CONFIGS.reduce((acc, api) => ({
      ...acc,
      [api.key]: {
        url: '',
        method: 'GET',
        headers: [{ key: '', value: '' }],
        params: [{ key: '', value: '' }],
        body: ''
      }
    }), {})
  )
  const [showCurlModal, setShowCurlModal] = useState(false)
  const [curlInput, setCurlInput] = useState('')
  const [parseError, setParseError] = useState('')

  const currentApi = API_CONFIGS[currentApiIndex]
  const currentConfig = apiConfigs[currentApi.key]

  const updateConfig = (field, value) => {
    setApiConfigs(prev => ({
      ...prev,
      [currentApi.key]: {
        ...prev[currentApi.key],
        [field]: value
      }
    }))
  }

  const addHeader = () => {
    updateConfig('headers', [...currentConfig.headers, { key: '', value: '' }])
  }

  const removeHeader = (index) => {
    if (currentConfig.headers.length > 1) {
      updateConfig('headers', currentConfig.headers.filter((_, i) => i !== index))
    }
  }

  const updateHeader = (index, field, value) => {
    const newHeaders = [...currentConfig.headers]
    newHeaders[index][field] = value
    updateConfig('headers', newHeaders)
  }

  const addParam = () => {
    updateConfig('params', [...currentConfig.params, { key: '', value: '' }])
  }

  const removeParam = (index) => {
    if (currentConfig.params.length > 1) {
      updateConfig('params', currentConfig.params.filter((_, i) => i !== index))
    }
  }

  const updateParam = (index, field, value) => {
    const newParams = [...currentConfig.params]
    newParams[index][field] = value
    updateConfig('params', newParams)
  }

  const goToNextApi = () => {
    if (currentApiIndex < API_CONFIGS.length - 1) {
      setCurrentApiIndex(currentApiIndex + 1)
    }
  }

  const goToPrevApi = () => {
    if (currentApiIndex > 0) {
      setCurrentApiIndex(currentApiIndex - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Call the complete setup API
      const response = await apiService.completeSetup({
        brandData,
        apiConfigs
      })

      if (response.success) {
        console.log('Setup completed:', response.data)
        onNext({ brandData, apiConfigs, setupResult: response.data })
      } else {
        setError(response.error || 'Failed to complete setup')
      }
    } catch (err) {
      console.error('Setup error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleParseCurl = () => {
    setParseError('')
    if (!curlInput.trim()) {
      setParseError('Please paste a curl command')
      return
    }

    if (!curlInput.toLowerCase().includes('curl')) {
      setParseError('Invalid curl command. Make sure it starts with "curl"')
      return
    }

    try {
      const parsed = parseCurlCommand(curlInput)
      
      if (!parsed.url) {
        setParseError('Could not extract URL from curl command')
        return
      }

      // Apply parsed config to current API
      setApiConfigs(prev => ({
        ...prev,
        [currentApi.key]: {
          url: parsed.url,
          method: parsed.method,
          headers: parsed.headers,
          params: parsed.params,
          body: parsed.body
        }
      }))

      // Close modal and reset
      setShowCurlModal(false)
      setCurlInput('')
    } catch (err) {
      setParseError('Failed to parse curl command. Please check the format.')
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setCurlInput(text)
      setParseError('')
    } catch (err) {
      setParseError('Could not access clipboard. Please paste manually.')
    }
  }

  const isLastApi = currentApiIndex === API_CONFIGS.length - 1
  const isFirstApi = currentApiIndex === 0

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-4xl bg-[#252542] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 py-4 border-b border-white/5">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-white font-semibold tracking-wider text-sm">AGENTIC PLATFORM</span>
        </div>

        {/* Progress Indicator */}
        <div className="px-8 pt-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-semibold">
                ✓
              </div>
              <span className="text-gray-400 text-sm">Brand Identity</span>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-green-500 to-purple-500 rounded mx-2"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                2
              </div>
              <span className="text-white text-sm font-medium">API Configuration</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 bg-[#1e1e3f]">
          <div className="flex items-center gap-3 mb-2">
            <Code className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">API Configuration</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">Configure your backend APIs for the AI shopping assistant</p>

          {/* API Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {API_CONFIGS.map((api, index) => {
              const Icon = api.icon
              return (
                <button
                  key={api.key}
                  onClick={() => setCurrentApiIndex(index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    currentApiIndex === index
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-[#2a2a4a] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {api.label}
                </button>
              )
            })}
          </div>

          {/* Current API Form */}
          <div className="bg-[#2a2a4a] rounded-xl p-6 space-y-5">
            {/* API Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                {React.createElement(currentApi.icon, { className: 'w-6 h-6 text-purple-400' })}
                <div>
                  <h3 className="text-white font-semibold">{currentApi.label}</h3>
                  <p className="text-gray-500 text-xs">{currentApi.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCurlModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/30 hover:border-emerald-400 transition-all group"
              >
                <Terminal className="w-4 h-4" />
                <span className="text-sm font-medium">Import from cURL</span>
                <Sparkles className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </button>
            </div>

            {/* URL & Method */}
            <div className="flex gap-3">
              <div className="w-32">
                <label className="block text-gray-400 text-xs mb-2">Method</label>
                <select
                  value={currentConfig.method}
                  onChange={(e) => updateConfig('method', e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
                >
                  {METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-gray-400 text-xs mb-2">URL</label>
                <div className="flex items-center bg-[#1e1e3f] border border-gray-700 rounded-lg overflow-hidden focus-within:border-purple-500">
                  <span className={`px-3 py-2.5 text-xs font-semibold text-white ${METHOD_COLORS[currentConfig.method]}`}>
                    {currentConfig.method}
                  </span>
                  <input
                    type="text"
                    value={currentConfig.url}
                    onChange={(e) => updateConfig('url', e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className="flex-1 px-3 py-2.5 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-400 text-xs">Headers</label>
                <button
                  type="button"
                  onClick={addHeader}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                >
                  <Plus className="w-3 h-3" /> Add Header
                </button>
              </div>
              <div className="space-y-2">
                {currentConfig.headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      placeholder="Key (e.g., Authorization)"
                      className="flex-1 px-3 py-2 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      placeholder="Value (e.g., Bearer token)"
                      className="flex-1 px-3 py-2 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(index)}
                      disabled={currentConfig.headers.length === 1}
                      className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Params */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-400 text-xs">Query Parameters</label>
                <button
                  type="button"
                  onClick={addParam}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                >
                  <Plus className="w-3 h-3" /> Add Param
                </button>
              </div>
              <div className="space-y-2">
                {currentConfig.params.map((param, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => updateParam(index, 'key', e.target.value)}
                      placeholder="Key (e.g., search)"
                      className="flex-1 px-3 py-2 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => updateParam(index, 'value', e.target.value)}
                      placeholder="Value (e.g., {{query}})"
                      className="flex-1 px-3 py-2 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeParam(index)}
                      disabled={currentConfig.params.length === 1}
                      className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            {(currentConfig.method === 'POST' || currentConfig.method === 'PUT' || currentConfig.method === 'PATCH') && (
              <div>
                <label className="block text-gray-400 text-xs mb-2">Request Body (JSON)</label>
                <textarea
                  value={currentConfig.body}
                  onChange={(e) => updateConfig('body', e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={5}
                  className="w-full px-3 py-2 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm font-mono resize-none"
                />
              </div>
            )}
          </div>

          {/* Navigation within APIs */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-500">
              API {currentApiIndex + 1} of {API_CONFIGS.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goToPrevApi}
                disabled={isFirstApi}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous API
              </button>
              {!isLastApi && (
                <button
                  type="button"
                  onClick={goToNextApi}
                  className="px-4 py-2 rounded-lg bg-[#2a2a4a] text-white hover:bg-[#3a3a5a] flex items-center gap-1"
                >
                  Next API <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Main Actions */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Back to Brand Identity
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* cURL Import Modal */}
      {showCurlModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#252542] rounded-2xl w-full max-w-2xl shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Import from cURL</h3>
                  <p className="text-gray-400 text-xs">Paste your cURL command to auto-fill API configuration</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCurlModal(false)
                  setCurlInput('')
                  setParseError('')
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-300 text-sm font-medium">cURL Command</label>
                <button
                  onClick={handlePasteFromClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e3f] border border-gray-700 text-gray-400 hover:text-white hover:border-emerald-500/50 transition-all text-xs"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Paste from Clipboard
                </button>
              </div>
              
              <textarea
                value={curlInput}
                onChange={(e) => {
                  setCurlInput(e.target.value)
                  setParseError('')
                }}
                placeholder={`curl -X POST 'https://api.example.com/endpoint' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer your-token' \\
  -d '{"key": "value"}'`}
                rows={8}
                className="w-full px-4 py-3 bg-[#1e1e3f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-sm font-mono resize-none"
              />

              {parseError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {parseError}
                </div>
              )}

              <div className="bg-[#1e1e3f]/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-300 font-medium mb-1">Supported formats:</p>
                    <ul className="space-y-0.5 text-gray-500">
                      <li>• HTTP methods: GET, POST, PUT, DELETE, PATCH</li>
                      <li>• Headers: -H or --header flags</li>
                      <li>• Request body: -d, --data, --data-raw flags</li>
                      <li>• Query parameters from URL</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#1e1e3f]/30">
              <button
                onClick={() => {
                  setShowCurlModal(false)
                  setCurlInput('')
                  setParseError('')
                }}
                className="px-5 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleParseCurl}
                disabled={!curlInput.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Import & Fill Fields
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiConfiguration

