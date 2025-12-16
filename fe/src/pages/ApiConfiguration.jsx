import React, { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Plus, X, Code, Search, ShoppingCart, CreditCard, Ticket, Loader2, Terminal, Clipboard, Sparkles, Zap, Edit3, Trash2, Shield, Send, CheckCircle } from 'lucide-react'
import apiService from '../services/api'

const DEFAULT_API_CONFIGS = [
  { 
    key: 'search_item', 
    label: 'Search Items', 
    icon: Search,
    description: 'API to search and fetch products from your catalog',
    isDefault: true
  },
  { 
    key: 'add_to_cart', 
    label: 'Add to Cart', 
    icon: ShoppingCart,
    description: 'API to add items to shopping cart',
    isDefault: true
  },
  { 
    key: 'checkout', 
    label: 'Checkout', 
    icon: CreditCard,
    description: 'API to process checkout and payments',
    isDefault: true
  },
  { 
    key: 'coupons', 
    label: 'Coupons', 
    icon: Ticket,
    description: 'API to fetch and validate discount coupons',
    isDefault: true
  },
  { 
    key: '2fa', 
    label: '2FA', 
    icon: Shield,
    description: 'Two-factor authentication APIs (Send & Verify OTP)',
    isDefault: true,
    isSpecial: true // Special flag for 2FA to render differently
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

function ApiConfiguration({ onNext, onBack, brandData, isSettingsMode = false }) {
  const [currentApiIndex, setCurrentApiIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [customApis, setCustomApis] = useState([])
  const [showAddCustomModal, setShowAddCustomModal] = useState(false)
  const [newCustomApiName, setNewCustomApiName] = useState('')
  const [newCustomApiDescription, setNewCustomApiDescription] = useState('')
  const [editingCustomApi, setEditingCustomApi] = useState(null)
  
  // Combine default and custom APIs
  const API_CONFIGS = [
    ...DEFAULT_API_CONFIGS,
    ...customApis.map(api => ({
      key: api.key,
      label: api.label,
      icon: Zap,
      description: api.description,
      isDefault: false
    }))
  ]
  
  const [apiConfigs, setApiConfigs] = useState(
    DEFAULT_API_CONFIGS.filter(api => api.key !== '2fa').reduce((acc, api) => ({
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
  
  // 2FA specific state
  const [twoFactorConfigs, setTwoFactorConfigs] = useState({
    send_otp: {
      url: '',
      method: 'POST',
      headers: [{ key: '', value: '' }],
      params: [{ key: '', value: '' }],
      body: '{\n  "phone": "{{phone_number}}"\n}'
    },
    verify_otp: {
      url: '',
      method: 'POST',
      headers: [{ key: '', value: '' }],
      params: [{ key: '', value: '' }],
      body: '{\n  "phone": "{{phone_number}}",\n  "otp": "{{otp_code}}"\n}'
    }
  })
  const [curlTarget, setCurlTarget] = useState(null) // For 2FA: 'send_otp' or 'verify_otp'
  
  const [showCurlModal, setShowCurlModal] = useState(false)
  const [curlInput, setCurlInput] = useState('')
  const [parseError, setParseError] = useState('')

  // In settings mode, notify parent of changes
  useEffect(() => {
    if (isSettingsMode && onNext) {
      onNext({ apiConfigs, twoFactorConfigs, customApis })
    }
  }, [apiConfigs, twoFactorConfigs, customApis, isSettingsMode])

  const currentApi = API_CONFIGS[currentApiIndex]
  const currentConfig = apiConfigs[currentApi?.key] || {
    url: '',
    method: 'GET',
    headers: [{ key: '', value: '' }],
    params: [{ key: '', value: '' }],
    body: ''
  }

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

  // 2FA Config helpers
  const update2FAConfig = (configType, field, value) => {
    setTwoFactorConfigs(prev => ({
      ...prev,
      [configType]: { ...prev[configType], [field]: value }
    }))
  }

  const add2FAHeader = (configType) => {
    setTwoFactorConfigs(prev => ({
      ...prev,
      [configType]: { ...prev[configType], headers: [...prev[configType].headers, { key: '', value: '' }] }
    }))
  }

  const remove2FAHeader = (configType, index) => {
    if (twoFactorConfigs[configType].headers.length > 1) {
      setTwoFactorConfigs(prev => ({
        ...prev,
        [configType]: { ...prev[configType], headers: prev[configType].headers.filter((_, i) => i !== index) }
      }))
    }
  }

  const update2FAHeader = (configType, index, field, value) => {
    const newHeaders = [...twoFactorConfigs[configType].headers]
    newHeaders[index][field] = value
    setTwoFactorConfigs(prev => ({
      ...prev,
      [configType]: { ...prev[configType], headers: newHeaders }
    }))
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

  // Custom API management
  const handleAddCustomApi = () => {
    if (!newCustomApiName.trim()) return
    
    const key = `custom_${Date.now()}`
    const newApi = {
      key,
      label: newCustomApiName.trim(),
      description: newCustomApiDescription.trim() || 'Custom API endpoint'
    }
    
    setCustomApis(prev => [...prev, newApi])
    setApiConfigs(prev => ({
      ...prev,
      [key]: {
        url: '',
        method: 'GET',
        headers: [{ key: '', value: '' }],
        params: [{ key: '', value: '' }],
        body: ''
      }
    }))
    
    // Navigate to the new custom API
    setCurrentApiIndex(API_CONFIGS.length) // Will be the index of the new API
    
    // Reset and close modal
    setNewCustomApiName('')
    setNewCustomApiDescription('')
    setShowAddCustomModal(false)
  }

  const handleEditCustomApi = (api) => {
    setEditingCustomApi(api)
    setNewCustomApiName(api.label)
    setNewCustomApiDescription(api.description)
    setShowAddCustomModal(true)
  }

  const handleUpdateCustomApi = () => {
    if (!newCustomApiName.trim() || !editingCustomApi) return
    
    setCustomApis(prev => prev.map(api => 
      api.key === editingCustomApi.key
        ? { ...api, label: newCustomApiName.trim(), description: newCustomApiDescription.trim() || 'Custom API endpoint' }
        : api
    ))
    
    // Reset and close modal
    setNewCustomApiName('')
    setNewCustomApiDescription('')
    setEditingCustomApi(null)
    setShowAddCustomModal(false)
  }

  const handleDeleteCustomApi = (apiKey) => {
    const apiIndex = API_CONFIGS.findIndex(api => api.key === apiKey)
    
    // Remove from custom APIs
    setCustomApis(prev => prev.filter(api => api.key !== apiKey))
    
    // Remove config
    setApiConfigs(prev => {
      const newConfigs = { ...prev }
      delete newConfigs[apiKey]
      return newConfigs
    })
    
    // Adjust current index if needed
    if (currentApiIndex >= apiIndex && currentApiIndex > 0) {
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
        apiConfigs,
        twoFactorConfigs
      })

      if (response.success) {
        console.log('Setup completed:', response.data)
        onNext({ brandData, apiConfigs, twoFactorConfigs, setupResult: response.data })
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

      // Check if this is for 2FA APIs
      if (curlTarget) {
        setTwoFactorConfigs(prev => ({
          ...prev,
          [curlTarget]: {
            url: parsed.url,
            method: parsed.method,
            headers: parsed.headers,
            params: parsed.params,
            body: parsed.body
          }
        }))
      } else {
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
      }

      // Close modal and reset
      setShowCurlModal(false)
      setCurlInput('')
      setCurlTarget(null)
    } catch (err) {
      setParseError('Failed to parse curl command. Please check the format.')
    }
  }

  const openCurlModal = (target = null) => {
    setCurlTarget(target)
    setCurlInput('')
    setParseError('')
    setShowCurlModal(true)
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
    <div className={`${isSettingsMode ? '' : 'min-h-screen'} bg-[#1a1a2e] flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Background decoration */}
      {!isSettingsMode && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* Main Card */}
      <div className={`relative w-full max-w-4xl ${isSettingsMode ? '' : 'bg-[#252542] rounded-3xl shadow-2xl'} overflow-hidden`}>
        {/* Header - Hide in settings mode */}
        {!isSettingsMode && (
          <div className="flex items-center justify-center gap-2 py-4 border-b border-white/5">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-white font-semibold tracking-wider text-sm">AGENTIC PLATFORM</span>
          </div>
        )}

        {/* Progress Indicator - Hide in settings mode */}
        {!isSettingsMode && (
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
        )}

        {/* Content */}
        <div className={`${isSettingsMode ? 'p-6' : 'p-8'} bg-[#1e1e3f]`}>
          {!isSettingsMode && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <Code className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">API Configuration</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">Configure your backend APIs for the AI shopping assistant</p>
            </>
          )}

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
                      ? api.isDefault 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'bg-[#2a2a4a] text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {api.label}
                  {!api.isDefault && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              )
            })}
            
            {/* Add Custom API Button */}
            <button
              onClick={() => {
                setEditingCustomApi(null)
                setNewCustomApiName('')
                setNewCustomApiDescription('')
                setShowAddCustomModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-[#2a2a4a] text-emerald-400 hover:text-emerald-300 border border-dashed border-emerald-500/50 hover:border-emerald-400"
            >
              <Plus className="w-4 h-4" />
              Add Custom API
            </button>
          </div>

          {/* Current API Form - Conditional for 2FA or Regular */}
          {currentApi?.key === '2fa' ? (
            /* 2FA Form - Shows Both Send OTP and Verify OTP */
            <div className="space-y-4">
              {/* 2FA Header */}
              <div className="flex items-center gap-3 p-4 bg-[#2a2a4a] rounded-xl border border-purple-500/30">
                <Shield className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-white font-semibold">Two-Factor Authentication</h3>
                  <p className="text-gray-500 text-xs">Configure Send OTP and Verify OTP APIs on the same page</p>
                </div>
              </div>
              
              {/* Two API Forms Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Send OTP Form */}
                <div className="bg-[#2a2a4a] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Send className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">Send OTP</h3>
                        <p className="text-gray-500 text-xs">API to send OTP to user</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCurlModal('send_otp')}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs"
                    >
                      <Terminal className="w-3 h-3" />
                      cURL
                    </button>
                  </div>
                  
                  {/* URL & Method */}
                  <div className="flex gap-2">
                    <div className="w-24">
                      <label className="block text-gray-400 text-xs mb-1">Method</label>
                      <select
                        value={twoFactorConfigs.send_otp.method}
                        onChange={(e) => update2FAConfig('send_otp', 'method', e.target.value)}
                        className="w-full px-2 py-2 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-xs"
                      >
                        {METHODS.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-gray-400 text-xs mb-1">URL</label>
                      <div className="flex items-center bg-[#1e1e3f] border border-gray-700 rounded-lg overflow-hidden">
                        <span className={`px-2 py-2 text-xs font-semibold text-white ${METHOD_COLORS[twoFactorConfigs.send_otp.method]}`}>
                          {twoFactorConfigs.send_otp.method}
                        </span>
                        <input
                          type="text"
                          value={twoFactorConfigs.send_otp.url}
                          onChange={(e) => update2FAConfig('send_otp', 'url', e.target.value)}
                          placeholder="https://api.example.com/otp/send"
                          className="flex-1 px-2 py-2 bg-transparent text-white placeholder-gray-500 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Headers */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-400 text-xs">Headers</label>
                      <button type="button" onClick={() => add2FAHeader('send_otp')} className="text-xs text-purple-400 hover:text-purple-300">
                        + Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {twoFactorConfigs.send_otp.headers.map((header, index) => (
                        <div key={index} className="flex gap-1">
                          <input
                            type="text"
                            value={header.key}
                            onChange={(e) => update2FAHeader('send_otp', index, 'key', e.target.value)}
                            placeholder="Key"
                            className="flex-1 px-2 py-1.5 bg-[#1e1e3f] border border-gray-700 rounded text-white placeholder-gray-500 text-xs"
                          />
                          <input
                            type="text"
                            value={header.value}
                            onChange={(e) => update2FAHeader('send_otp', index, 'value', e.target.value)}
                            placeholder="Value"
                            className="flex-1 px-2 py-1.5 bg-[#1e1e3f] border border-gray-700 rounded text-white placeholder-gray-500 text-xs"
                          />
                          <button type="button" onClick={() => remove2FAHeader('send_otp', index)} className="p-1 text-gray-500 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Body */}
                  {(twoFactorConfigs.send_otp.method === 'POST' || twoFactorConfigs.send_otp.method === 'PUT') && (
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Request Body</label>
                      <textarea
                        value={twoFactorConfigs.send_otp.body}
                        onChange={(e) => update2FAConfig('send_otp', 'body', e.target.value)}
                        placeholder='{"phone": "{{phone_number}}"}'
                        rows={3}
                        className="w-full px-2 py-2 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white placeholder-gray-500 text-xs font-mono resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Verify OTP Form */}
                <div className="bg-[#2a2a4a] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">Verify OTP</h3>
                        <p className="text-gray-500 text-xs">API to verify OTP code</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCurlModal('verify_otp')}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs"
                    >
                      <Terminal className="w-3 h-3" />
                      cURL
                    </button>
                  </div>
                  
                  {/* URL & Method */}
                  <div className="flex gap-2">
                    <div className="w-24">
                      <label className="block text-gray-400 text-xs mb-1">Method</label>
                      <select
                        value={twoFactorConfigs.verify_otp.method}
                        onChange={(e) => update2FAConfig('verify_otp', 'method', e.target.value)}
                        className="w-full px-2 py-2 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-xs"
                      >
                        {METHODS.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-gray-400 text-xs mb-1">URL</label>
                      <div className="flex items-center bg-[#1e1e3f] border border-gray-700 rounded-lg overflow-hidden">
                        <span className={`px-2 py-2 text-xs font-semibold text-white ${METHOD_COLORS[twoFactorConfigs.verify_otp.method]}`}>
                          {twoFactorConfigs.verify_otp.method}
                        </span>
                        <input
                          type="text"
                          value={twoFactorConfigs.verify_otp.url}
                          onChange={(e) => update2FAConfig('verify_otp', 'url', e.target.value)}
                          placeholder="https://api.example.com/otp/verify"
                          className="flex-1 px-2 py-2 bg-transparent text-white placeholder-gray-500 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Headers */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-400 text-xs">Headers</label>
                      <button type="button" onClick={() => add2FAHeader('verify_otp')} className="text-xs text-purple-400 hover:text-purple-300">
                        + Add
                      </button>
                    </div>
                    <div className="space-y-1">
                      {twoFactorConfigs.verify_otp.headers.map((header, index) => (
                        <div key={index} className="flex gap-1">
                          <input
                            type="text"
                            value={header.key}
                            onChange={(e) => update2FAHeader('verify_otp', index, 'key', e.target.value)}
                            placeholder="Key"
                            className="flex-1 px-2 py-1.5 bg-[#1e1e3f] border border-gray-700 rounded text-white placeholder-gray-500 text-xs"
                          />
                          <input
                            type="text"
                            value={header.value}
                            onChange={(e) => update2FAHeader('verify_otp', index, 'value', e.target.value)}
                            placeholder="Value"
                            className="flex-1 px-2 py-1.5 bg-[#1e1e3f] border border-gray-700 rounded text-white placeholder-gray-500 text-xs"
                          />
                          <button type="button" onClick={() => remove2FAHeader('verify_otp', index)} className="p-1 text-gray-500 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Body */}
                  {(twoFactorConfigs.verify_otp.method === 'POST' || twoFactorConfigs.verify_otp.method === 'PUT') && (
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Request Body</label>
                      <textarea
                        value={twoFactorConfigs.verify_otp.body}
                        onChange={(e) => update2FAConfig('verify_otp', 'body', e.target.value)}
                        placeholder='{"phone": "{{phone_number}}", "otp": "{{otp_code}}"}'
                        rows={3}
                        className="w-full px-2 py-2 bg-[#1e1e3f] border border-gray-700 rounded-lg text-white placeholder-gray-500 text-xs font-mono resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Available Variables Info */}
              <div className="p-3 bg-[#2a2a4a]/50 rounded-xl border border-gray-700/50">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-300 text-xs font-medium mb-1">Available Variables</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <code className="px-2 py-0.5 bg-[#1e1e3f] text-purple-300 rounded">{'{{phone_number}}'}</code>
                      <code className="px-2 py-0.5 bg-[#1e1e3f] text-purple-300 rounded">{'{{email}}'}</code>
                      <code className="px-2 py-0.5 bg-[#1e1e3f] text-purple-300 rounded">{'{{otp_code}}'}</code>
                      <code className="px-2 py-0.5 bg-[#1e1e3f] text-purple-300 rounded">{'{{user_id}}'}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Regular API Form */
            <div className="bg-[#2a2a4a] rounded-xl p-6 space-y-5">
              {/* API Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  {React.createElement(currentApi.icon, { className: `w-6 h-6 ${currentApi.isDefault ? 'text-purple-400' : 'text-emerald-400'}` })}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{currentApi.label}</h3>
                      {!currentApi.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">{currentApi.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Edit/Delete for Custom APIs */}
                  {!currentApi.isDefault && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditCustomApi(currentApi)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Edit API name"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomApi(currentApi.key)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete API"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-px h-6 bg-gray-700 mx-1"></div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => openCurlModal()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/30 hover:border-emerald-400 transition-all group"
                  >
                    <Terminal className="w-4 h-4" />
                    <span className="text-sm font-medium">Import from cURL</span>
                    <Sparkles className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  </button>
                </div>
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
          )}

          {/* Navigation within APIs */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-gray-500">
                API {currentApiIndex + 1} of {API_CONFIGS.length}
              </span>
              {customApis.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {customApis.length} custom
                </span>
              )}
            </div>
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

          {/* Main Actions - Hide in settings mode */}
          {!isSettingsMode && (
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
          )}
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

      {/* Add/Edit Custom API Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#252542] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {editingCustomApi ? 'Edit Custom API' : 'Add Custom API'}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {editingCustomApi ? 'Update your custom API details' : 'Create a new custom API endpoint'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddCustomModal(false)
                  setNewCustomApiName('')
                  setNewCustomApiDescription('')
                  setEditingCustomApi(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  API Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomApiName}
                  onChange={(e) => setNewCustomApiName(e.target.value)}
                  placeholder="e.g., Get Recommendations"
                  className="w-full px-4 py-3 bg-[#1e1e3f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={newCustomApiDescription}
                  onChange={(e) => setNewCustomApiDescription(e.target.value)}
                  placeholder="e.g., API to fetch product recommendations"
                  className="w-full px-4 py-3 bg-[#1e1e3f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-sm"
                />
              </div>

              <div className="bg-[#1e1e3f]/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p>
                    Custom APIs allow you to extend your AI assistant with additional functionality specific to your business needs.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#1e1e3f]/30">
              <button
                onClick={() => {
                  setShowAddCustomModal(false)
                  setNewCustomApiName('')
                  setNewCustomApiDescription('')
                  setEditingCustomApi(null)
                }}
                className="px-5 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingCustomApi ? handleUpdateCustomApi : handleAddCustomApi}
                disabled={!newCustomApiName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none text-sm"
              >
                <Plus className="w-4 h-4" />
                {editingCustomApi ? 'Update API' : 'Add API'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiConfiguration

