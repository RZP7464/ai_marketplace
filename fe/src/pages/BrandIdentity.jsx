import React, { useState, useRef } from 'react'
import { Upload, X, ChevronRight, Image, Plus } from 'lucide-react'

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

function BrandIdentity({ onNext, onBack }) {
  const [formData, setFormData] = useState({
    display_logo: null,
    display_name: '',
    display_tagline: '',
    display_message: '',
    display_category: []
  })
  const [logoPreview, setLogoPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const fileInputRef = useRef(null)
  const customInputRef = useRef(null)

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

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-2xl bg-[#252542] rounded-3xl shadow-2xl overflow-hidden">
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

        {/* Form Content */}
        <div className="p-8 bg-[#1e1e3f]">
          <h2 className="text-2xl font-bold text-white mb-2">Brand Identity</h2>
          <p className="text-gray-400 text-sm mb-8">Tell us about your brand to personalize your AI agent</p>

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

            {/* Actions */}
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
          </form>
        </div>
      </div>
    </div>
  )
}

export default BrandIdentity

