import React, { useState } from 'react'
import { Store, Key, Search, ShoppingCart, CreditCard, Package, Tag, Sparkles, Save, LogOut, Eye, EyeOff } from 'lucide-react'

const MerchantDashboard = ({ onLogout }) => {
  const [merchantData, setMerchantData] = useState({
    merchantName: '',
    storeName: '',
    logo: '',
    searchApi: '',
    addToCartApi: '',
    checkoutApi: '',
    paymentsApi: '',
    couponsApi: '',
    experienceConfig: {
      primaryColor: '#3b82f6',
      secondaryColor: '#9333ea',
      welcomeMessage: 'Welcome to our store!',
      assistantName: 'Shopping Assistant'
    }
  })

  const [showApiKeys, setShowApiKeys] = useState({
    search: false,
    cart: false,
    checkout: false,
    payments: false,
    coupons: false
  })

  const handleInputChange = (field, value) => {
    setMerchantData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleExperienceChange = (field, value) => {
    setMerchantData(prev => ({
      ...prev,
      experienceConfig: {
        ...prev.experienceConfig,
        [field]: value
      }
    }))
  }

  const handleSave = () => {
    console.log('Saving merchant data:', merchantData)
    alert('Configuration saved successfully!')
  }

  const toggleApiKeyVisibility = (api) => {
    setShowApiKeys(prev => ({
      ...prev,
      [api]: !prev[api]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Merchant Dashboard</h1>
                <p className="text-sm text-gray-500">Configure your AI shopping assistant</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Store Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Store Information Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                Store Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    value={merchantData.merchantName}
                    onChange={(e) => handleInputChange('merchantName', e.target.value)}
                    placeholder="Enter merchant name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={merchantData.storeName}
                    onChange={(e) => handleInputChange('storeName', e.target.value)}
                    placeholder="Enter store name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={merchantData.logo}
                    onChange={(e) => handleInputChange('logo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Experience Configuration */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Experience Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={merchantData.experienceConfig.primaryColor}
                      onChange={(e) => handleExperienceChange('primaryColor', e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={merchantData.experienceConfig.primaryColor}
                      onChange={(e) => handleExperienceChange('primaryColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={merchantData.experienceConfig.secondaryColor}
                      onChange={(e) => handleExperienceChange('secondaryColor', e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={merchantData.experienceConfig.secondaryColor}
                      onChange={(e) => handleExperienceChange('secondaryColor', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    value={merchantData.experienceConfig.welcomeMessage}
                    onChange={(e) => handleExperienceChange('welcomeMessage', e.target.value)}
                    placeholder="Enter welcome message"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assistant Name
                  </label>
                  <input
                    type="text"
                    value={merchantData.experienceConfig.assistantName}
                    onChange={(e) => handleExperienceChange('assistantName', e.target.value)}
                    placeholder="e.g., Shopping Assistant"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - API Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Key className="w-6 h-6 text-blue-600" />
              API Configuration
            </h2>

            {/* Search API */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">Search Products API</h3>
                  <p className="text-sm text-gray-500">Configure product search endpoint</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Endpoint
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys.search ? "text" : "password"}
                      value={merchantData.searchApi}
                      onChange={(e) => handleInputChange('searchApi', e.target.value)}
                      placeholder="https://api.yourstore.com/search"
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility('search')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys.search ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Expected Response:</strong> JSON with products array containing id, name, price, image, description
                  </p>
                </div>
              </div>
            </div>

            {/* Add to Cart API */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">Add to Cart API</h3>
                  <p className="text-sm text-gray-500">Configure cart management endpoint</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Endpoint
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys.cart ? "text" : "password"}
                      value={merchantData.addToCartApi}
                      onChange={(e) => handleInputChange('addToCartApi', e.target.value)}
                      placeholder="https://api.yourstore.com/cart/add"
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility('cart')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys.cart ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-800">
                    <strong>Expected Payload:</strong> productId, quantity | <strong>Response:</strong> Updated cart object
                  </p>
                </div>
              </div>
            </div>

            {/* Checkout API */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">Checkout API</h3>
                  <p className="text-sm text-gray-500">Configure checkout process endpoint</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Endpoint
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys.checkout ? "text" : "password"}
                      value={merchantData.checkoutApi}
                      onChange={(e) => handleInputChange('checkoutApi', e.target.value)}
                      placeholder="https://api.yourstore.com/checkout"
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility('checkout')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys.checkout ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-800">
                    <strong>Expected Payload:</strong> cart, shipping info | <strong>Response:</strong> Order ID, total
                  </p>
                </div>
              </div>
            </div>

            {/* Payments API */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">Payments API</h3>
                  <p className="text-sm text-gray-500">Configure payment processing endpoint</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Endpoint
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys.payments ? "text" : "password"}
                      value={merchantData.paymentsApi}
                      onChange={(e) => handleInputChange('paymentsApi', e.target.value)}
                      placeholder="https://api.yourstore.com/payments"
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility('payments')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys.payments ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Expected Payload:</strong> orderId, payment method | <strong>Response:</strong> Transaction status
                  </p>
                </div>
              </div>
            </div>

            {/* Coupons API */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">Coupons API</h3>
                  <p className="text-sm text-gray-500">Configure coupon validation endpoint</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Endpoint
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys.coupons ? "text" : "password"}
                      value={merchantData.couponsApi}
                      onChange={(e) => handleInputChange('couponsApi', e.target.value)}
                      placeholder="https://api.yourstore.com/coupons/validate"
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility('coupons')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys.coupons ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                  <p className="text-xs text-pink-800">
                    <strong>Expected Payload:</strong> couponCode, cartTotal | <strong>Response:</strong> Discount amount, validity
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105"
              >
                <Save className="w-5 h-5" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MerchantDashboard

