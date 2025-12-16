import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, ChevronRight, Image, Plus, Palette, Send, ShoppingCart, MessageSquare, Eye, Monitor, Smartphone, Bot, EyeOff } from 'lucide-react'

const TRENDING_CATEGORIES = [
  '👗 Fashion & Apparel',
  '📱 Electronics',
  '🏠 Home & Garden',
  '💄 Health & Beauty',
  '⚽ Sports & Outdoors',
  '🍕 Food & Beverages',
  '📚 Books & Media',
  '🎮 Toys & Games',
  '🚗 Automotive',
  '💎 Jewelry & Accessories',
  '🐾 Pet Supplies',
  '✨ Lifestyle',
  '🎨 Art & Crafts',
  '🌱 Eco-Friendly'
]

const PRESET_COLORS = [
  { name: 'Purple', primary: '#8B5CF6', secondary: '#A78BFA' },
  { name: 'Blue', primary: '#3B82F6', secondary: '#60A5FA' },
  { name: 'Green', primary: '#10B981', secondary: '#34D399' },
  { name: 'Red', primary: '#EF4444', secondary: '#F87171' },
  { name: 'Orange', primary: '#F97316', secondary: '#FB923C' },
  { name: 'Pink', primary: '#EC4899', secondary: '#F472B6' },
  { name: 'Teal', primary: '#14B8A6', secondary: '#2DD4BF' },
  { name: 'Indigo', primary: '#6366F1', secondary: '#818CF8' },
]

function BrandIdentity({ onNext, onBack, isSettingsMode = false, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    display_logo: null,
    display_name: '',
    display_tagline: '',
    display_message: '',
    display_category: [],
    primary_color: '#8B5CF6',
    secondary_color: '#A78BFA',
    accent_color: '#F472B6',
    base_prompt: ''
  })
  const [logoPreview, setLogoPreview] = useState(initialData?.logoPreview || null)
  const [errors, setErrors] = useState({})
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [previewMode, setPreviewMode] = useState('web') // 'web' or 'mobile'
  const fileInputRef = useRef(null)
  const customInputRef = useRef(null)

  // In settings mode, notify parent of changes
  useEffect(() => {
    if (isSettingsMode && onNext) {
      onNext({ ...formData, logoPreview })
    }
  }, [formData, logoPreview, isSettingsMode])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, display_logo: 'File size must be less than 5MB' }))
        return
      }
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, display_logo: 'Please upload an image file' }))
        return
      }
      setFormData(prev => ({ ...prev, display_logo: file }))
      setLogoPreview(URL.createObjectURL(file))
      setErrors(prev => ({ ...prev, display_logo: '' }))
    }
  }

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, display_logo: null }))
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      display_category: prev.display_category.includes(category)
        ? prev.display_category.filter(c => c !== category)
        : [...prev.display_category, category]
    }))
  }

  const addCustomCategory = () => {
    if (customCategory.trim() && !formData.display_category.includes(customCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        display_category: [...prev.display_category, customCategory.trim()]
      }))
      setCustomCategory('')
      setShowCustomInput(false)
    }
  }

  const handleCustomCategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomCategory()
    } else if (e.key === 'Escape') {
      setShowCustomInput(false)
      setCustomCategory('')
    }
  }

  const removeCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      display_category: prev.display_category.filter(c => c !== category)
    }))
  }

  const isFormValid = () => {
    return formData.display_logo && 
           formData.display_name.trim() && 
           formData.display_tagline.trim()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (!formData.display_logo) {
      newErrors.display_logo = 'Logo is required'
    }
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Brand name is required'
    }
    if (!formData.display_tagline.trim()) {
      newErrors.display_tagline = 'Tagline is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onNext(formData)
  }

  // Render the preview panel - matches actual chatbot structure
  const renderPreviewPanel = () => (
    <div>
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <span className="text-gray-400 text-sm font-medium">Live Preview</span>
        </div>
        
        {/* Web/Mobile Toggle */}
        <div className="flex items-center bg-[#2a2a4a] rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('web')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              previewMode === 'web'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Web
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              previewMode === 'mobile'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="relative flex justify-center">
        {previewMode === 'web' ? (
          /* Desktop Browser Frame */
          <div className="w-[380px] bg-gray-100 rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            {/* Browser Top Bar */}
            <div className="h-8 bg-gray-200 flex items-center px-3 gap-2 border-b border-gray-300">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 mx-2">
                <div className="bg-white rounded-md px-3 py-1 text-[10px] text-gray-500 truncate">
                  {formData.display_name ? `${formData.display_name.toLowerCase().replace(/\s+/g, '')}.shop` : 'yourstore.shop'}
                </div>
              </div>
            </div>
            
            {/* App Content */}
            <div className="h-[500px] bg-gray-50 flex flex-col">
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                      style={{ 
                        background: logoPreview 
                          ? 'transparent' 
                          : `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})` 
                      }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">
                      {formData.display_name || 'Shopping Assistant'}
                    </span>
                  </div>
                  <button className="relative p-1.5 hover:bg-gray-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-gray-700" />
                    <span 
                      className="absolute -top-1 -right-1 w-4 h-4 text-white text-[10px] font-semibold rounded-full flex items-center justify-center"
                      style={{ backgroundColor: formData.primary_color }}
                    >
                      2
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-2 mb-3">
                  {/* Bot Welcome Message - uses Secondary color */}
                  <div className="flex justify-start">
                    <div 
                      className="max-w-[240px] px-3 py-2 rounded-lg text-gray-900 text-xs"
                      style={{ 
                        backgroundColor: `${formData.secondary_color}15`,
                        border: `1px solid ${formData.secondary_color}`
                      }}
                    >
                      {formData.display_message || `👋 Welcome to ${formData.display_name || 'our store'}! How can I help you today?`}
                    </div>
                  </div>
                  {/* User Message - uses Accent color */}
                  <div className="flex justify-end">
                    <div 
                      className="max-w-[200px] px-3 py-2 rounded-lg text-white text-xs"
                      style={{ backgroundColor: formData.accent_color }}
                    >
                      Show me sneakers
                    </div>
                  </div>
                  {/* Bot Response - uses Secondary color */}
                  <div className="flex justify-start">
                    <div 
                      className="max-w-[240px] px-3 py-2 rounded-lg text-gray-900 text-xs"
                      style={{ 
                        backgroundColor: `${formData.secondary_color}15`,
                        border: `1px solid ${formData.secondary_color}`
                      }}
                    >
                      I found 3 products for you! 🎉
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((item) => (
                    <div key={item} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <span className="text-2xl">{item === 1 ? '👟' : '👕'}</span>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {item === 1 ? 'Classic Sneakers' : 'Cotton T-Shirt'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div>
                            <span className="text-xs font-semibold text-gray-900">$120</span>
                            <span className="text-[10px] text-gray-400 line-through ml-1">$144</span>
                          </div>
                          <button 
                            className="px-2 py-1 text-white text-[10px] font-medium rounded"
                            style={{ backgroundColor: formData.primary_color }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Categories + Input Area */}
              <div className="border-t border-gray-200 bg-white px-3 py-2">
                {formData.display_category.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center mb-2">
                    {formData.display_category.slice(0, 3).map((cat, idx) => (
                      <button 
                        key={idx}
                        className="px-2 py-1 border border-gray-300 rounded-full text-[10px] text-gray-600 hover:bg-gray-50 bg-gray-50"
                      >
                        {cat.length > 15 ? cat.substring(0, 15) + '...' : cat}
                      </button>
                    ))}
                    {formData.display_category.length > 3 && (
                      <span className="px-2 py-1 text-[10px] text-gray-400">
                        +{formData.display_category.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    placeholder={formData.display_tagline || "Ask me anything..."}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-500 bg-gray-50"
                  />
                  <button 
                    className="px-3 py-2 text-white text-xs font-medium rounded-lg flex items-center gap-1"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Mobile Phone Frame */
          <div className="w-[280px] bg-gray-900 rounded-[40px] p-2 shadow-2xl border-4 border-gray-800">
            {/* Notch */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full z-10"></div>
            
            {/* Screen */}
            <div className="w-full h-[520px] bg-gray-50 rounded-[32px] overflow-hidden flex flex-col">
              {/* Status Bar */}
              <div className="h-10 bg-white flex items-center justify-between px-6 pt-2">
                <span className="text-xs font-semibold text-gray-900">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 border border-gray-900 rounded-sm">
                    <div className="w-3/4 h-full bg-gray-900 rounded-sm"></div>
                  </div>
                </div>
              </div>
              
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
                      style={{ 
                        background: logoPreview 
                          ? 'transparent' 
                          : `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})` 
                      }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 text-xs">
                      {formData.display_name || 'Shopping Assistant'}
                    </span>
                  </div>
                  <button className="relative p-1 hover:bg-gray-100 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-gray-700" />
                    <span 
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 text-white text-[8px] font-semibold rounded-full flex items-center justify-center"
                      style={{ backgroundColor: formData.primary_color }}
                    >
                      2
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-2 mb-2">
                  {/* Bot Welcome - Secondary color */}
                  <div className="flex justify-start">
                    <div 
                      className="max-w-[180px] px-2.5 py-1.5 rounded-lg text-gray-900 text-[10px]"
                      style={{ 
                        backgroundColor: `${formData.secondary_color}15`,
                        border: `1px solid ${formData.secondary_color}`
                      }}
                    >
                      {formData.display_message || `👋 Welcome to ${formData.display_name || 'our store'}!`}
                    </div>
                  </div>
                  {/* User Message - Accent color */}
                  <div className="flex justify-end">
                    <div 
                      className="max-w-[140px] px-2.5 py-1.5 rounded-lg text-white text-[10px]"
                      style={{ backgroundColor: formData.accent_color }}
                    >
                      Show me sneakers
                    </div>
                  </div>
                  {/* Bot Response - Secondary color */}
                  <div className="flex justify-start">
                    <div 
                      className="max-w-[180px] px-2.5 py-1.5 rounded-lg text-gray-900 text-[10px]"
                      style={{ 
                        backgroundColor: `${formData.secondary_color}15`,
                        border: `1px solid ${formData.secondary_color}`
                      }}
                    >
                      Found 3 products! 🎉
                    </div>
                  </div>
                </div>
                
                {/* Single Product Card for Mobile */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-24 bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl">👟</span>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-medium text-gray-900">Classic Sneakers</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-semibold text-gray-900">$120</span>
                      <button 
                        className="px-2 py-0.5 text-white text-[9px] font-medium rounded"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Categories + Input Area */}
              <div className="border-t border-gray-200 bg-white px-2 py-2">
                {formData.display_category.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mb-2">
                    {formData.display_category.slice(0, 2).map((cat, idx) => (
                      <button 
                        key={idx}
                        className="px-2 py-0.5 border border-gray-300 rounded-full text-[9px] text-gray-600 bg-gray-50"
                      >
                        {cat.length > 10 ? cat.substring(0, 10) + '...' : cat}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    placeholder={formData.display_tagline || "Ask me anything..."}
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-[10px] text-gray-500 bg-gray-50"
                  />
                  <button 
                    className="px-2.5 py-1.5 text-white text-[10px] font-medium rounded-lg"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {/* Home Indicator */}
              <div className="h-5 bg-white flex items-center justify-center">
                <div className="w-24 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Glow Effect */}
        <div 
          className="absolute -inset-4 rounded-2xl blur-2xl -z-10 opacity-20"
          style={{ background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})` }}
        />
      </div>
      
      {/* Color Legend */}
      <div className="mt-4 p-3 bg-[#2a2a4a]/50 rounded-xl border border-gray-700/50">
        <p className="text-gray-400 text-xs mb-2 font-medium">Color Usage:</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: formData.primary_color }}
            />
            <span className="text-gray-500 text-[10px]">Primary (Buttons, Badge)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: formData.secondary_color }}
            />
            <span className="text-gray-500 text-[10px]">Secondary (Bot Messages)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: formData.accent_color }}
            />
            <span className="text-gray-500 text-[10px]">Accent (User Messages)</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`${isSettingsMode ? 'h-[calc(100vh-120px)]' : 'h-screen'} bg-[#1a1a2e] flex items-center justify-center p-4 relative`}>
      {/* Background decoration */}
      {!isSettingsMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* Main Container - Two Column Layout */}
      <div className="relative w-full max-w-6xl flex gap-8 h-[calc(100%-2rem)]">
        {/* Left Side - Form */}
        <div className={`flex-1 max-w-2xl max-h-full flex flex-col ${isSettingsMode ? '' : 'bg-[#252542] rounded-3xl shadow-2xl overflow-hidden'}`}>
        
        {/* Header + Progress (Sticky) - Hide in settings mode */}
        {!isSettingsMode && (
          <div className="flex-shrink-0 bg-[#252542]">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 py-4 border-b border-white/5">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-white font-semibold tracking-wider text-sm">AGENTIC PLATFORM</span>
            </div>

            {/* Progress Indicator */}
            <div className="px-8 pt-6 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    1
                  </div>
                  <span className="text-white text-sm font-medium">Brand Identity</span>
                </div>
                <div className="flex-1 h-1 bg-gray-700 rounded mx-2">
                  <div className="h-full w-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
                  2
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Content (Scrollable) */}
        <div className={`flex-1 overflow-y-auto scrollbar-hide ${isSettingsMode ? 'p-6' : 'p-8'} bg-[#1e1e3f]`}>
          {!isSettingsMode && (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Brand Identity</h2>
              <p className="text-gray-400 text-sm mb-8">Tell us about your brand to personalize your AI agent</p>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">
                Brand Logo <span className="text-red-400">*</span>
              </label>
              <div className="flex items-start gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 rounded-xl object-cover border-2 border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-24 h-24 rounded-xl border-2 border-dashed ${
                      errors.display_logo ? 'border-red-500' : 'border-gray-600'
                    } flex flex-col items-center justify-center hover:border-purple-500 transition-colors bg-[#2a2a4a]`}
                  >
                    <Image className="w-8 h-8 text-gray-500 mb-1" />
                    <span className="text-gray-500 text-xs">Upload</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">
                    Upload your brand logo. Recommended size: 200x200px.
                    <br />Max file size: 5MB. Formats: PNG, JPG, SVG
                  </p>
                  {errors.display_logo && (
                    <p className="text-red-400 text-xs mt-1">{errors.display_logo}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">
                Brand Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                placeholder="Enter your brand name"
                maxLength={50}
                className={`w-full px-4 py-3 bg-[#2a2a4a] border ${
                  errors.display_name ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
              />
              <div className="flex justify-between mt-1">
                {errors.display_name && (
                  <p className="text-red-400 text-xs">{errors.display_name}</p>
                )}
                <p className="text-gray-500 text-xs ml-auto">{formData.display_name.length}/50</p>
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">
                Brand Tagline <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="display_tagline"
                value={formData.display_tagline}
                onChange={handleInputChange}
                placeholder="Enter a catchy tagline for your brand"
                maxLength={100}
                className={`w-full px-4 py-3 bg-[#2a2a4a] border ${
                  errors.display_tagline ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
              />
              <div className="flex justify-between mt-1">
                {errors.display_tagline && (
                  <p className="text-red-400 text-xs">{errors.display_tagline}</p>
                )}
                <p className="text-gray-500 text-xs ml-auto">{formData.display_tagline.length}/100</p>
              </div>
            </div>

            {/* Welcome Message */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">
                Welcome Message <span className="text-gray-600">(Optional)</span>
              </label>
              <textarea
                name="display_message"
                value={formData.display_message}
                onChange={handleInputChange}
                placeholder="Enter a welcome message for your customers"
                rows={3}
                maxLength={250}
                className="w-full px-4 py-3 bg-[#2a2a4a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
              <p className="text-gray-500 text-xs mt-1 text-right">{formData.display_message.length}/250</p>
            </div>

            {/* Base Prompt - Internal AI Configuration */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <label className="text-gray-400 text-xs">
                  Base Prompt <span className="text-gray-600">(AI Instructions)</span>
                </label>
              </div>
              
              {/* Info Banner */}
              <div className="flex items-start gap-2 p-3 mb-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <EyeOff className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-purple-300 text-xs font-medium">This is internal configuration only</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    The base prompt guides your AI assistant's behavior. It won't be shown to users or anywhere in the UI - it's purely for AI context.
                  </p>
                </div>
              </div>
              
              <textarea
                name="base_prompt"
                value={formData.base_prompt}
                onChange={handleInputChange}
                placeholder="Example: You are a helpful shopping assistant for [Brand Name]. Help customers find products, answer questions about sizing, shipping, and returns. Be friendly, concise, and always recommend products that match their needs. If asked about competitors, politely redirect to our offerings."
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-3 bg-[#2a2a4a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none font-mono text-sm"
              />
              <div className="flex justify-between mt-1">
                <p className="text-gray-500 text-xs">
                  💡 Tip: Be specific about tone, product focus, and how to handle edge cases
                </p>
                <p className="text-gray-500 text-xs">{formData.base_prompt.length}/1000</p>
              </div>
            </div>

            {/* Brand Colors */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-purple-400" />
                <label className="text-gray-400 text-xs">Brand Colors</label>
                <span className="text-gray-600 text-xs">(Customize your store's look)</span>
              </div>
              
              {/* Color Preview */}
              <div 
                className="mb-4 p-4 rounded-xl border border-gray-700"
                style={{ 
                  background: `linear-gradient(135deg, ${formData.primary_color}20, ${formData.secondary_color}20)` 
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg shadow-lg"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                  <div>
                    <p className="text-white text-sm font-medium">{formData.display_name || 'Your Brand'}</p>
                    <p className="text-gray-400 text-xs">{formData.display_tagline || 'Your tagline here'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    Primary Button
                  </button>
                  <button 
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: formData.secondary_color }}
                  >
                    Secondary
                  </button>
                  <button 
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ backgroundColor: formData.accent_color }}
                  >
                    Accent
                  </button>
                </div>
              </div>

              {/* Preset Colors */}
              <div className="mb-4">
                <p className="text-gray-500 text-xs mb-2">Quick presets:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        primary_color: preset.primary,
                        secondary_color: preset.secondary
                      }))}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        formData.primary_color === preset.primary 
                          ? 'border-white bg-white/10' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                      />
                      <span className="text-gray-300">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-500 text-xs mb-2">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1 px-2 py-1.5 bg-[#2a2a4a] border border-gray-700 rounded-lg text-white text-xs uppercase focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 text-xs mb-2">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="flex-1 px-2 py-1.5 bg-[#2a2a4a] border border-gray-700 rounded-lg text-white text-xs uppercase focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 text-xs mb-2">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.accent_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="flex-1 px-2 py-1.5 bg-[#2a2a4a] border border-gray-700 rounded-lg text-white text-xs uppercase focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                🎨 These colors will be used throughout your store to match your brand identity
              </p>
            </div>

            {/* Trending Categories */}
            <div>
              <label className="block text-gray-400 text-xs mb-2">
                Trending Categories <span className="text-gray-600">(Select or create your own with emojis! 🎉)</span>
              </label>
              
              {/* Selected Categories */}
              {formData.display_category.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#2a2a4a]/50 rounded-lg">
                  <span className="text-gray-500 text-xs w-full mb-1">Selected:</span>
                  {formData.display_category.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    >
                      {category}
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Trending Categories */}
              <div className="flex flex-wrap gap-2">
                {TRENDING_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      formData.display_category.includes(category)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-[#2a2a4a] text-gray-400 hover:text-white border border-gray-700 hover:border-purple-500'
                    }`}
                  >
                    {category}
                  </button>
                ))}
                
                {/* Add Custom Category Button/Input */}
                {showCustomInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={customInputRef}
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      onKeyDown={handleCustomCategoryKeyDown}
                      placeholder="🏷️ Type category..."
                      maxLength={30}
                      autoFocus
                      className="px-3 py-1.5 rounded-full text-xs bg-[#2a2a4a] border border-purple-500 text-white placeholder-gray-500 focus:outline-none w-40"
                    />
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      disabled={!customCategory.trim()}
                      className="p-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(false)
                        setCustomCategory('')
                      }}
                      className="p-1.5 rounded-full bg-gray-700 text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#2a2a4a] text-gray-400 hover:text-white border border-dashed border-gray-600 hover:border-purple-500 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Custom
                  </button>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-2">
                💡 Tip: Add emojis to make your categories stand out!
              </p>
            </div>

            {/* Actions - Hide in settings mode */}
            {!isSettingsMode && (
              <div className="flex items-center justify-between pt-4">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`ml-auto flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isFormValid()
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </form>
        </div>
        </div>
        
        {/* Right Side - Preview (Vertically Centered) */}
        <div className="hidden lg:flex items-center justify-center h-full">
          {renderPreviewPanel()}
        </div>
      </div>
    </div>
  )
}

export default BrandIdentity

