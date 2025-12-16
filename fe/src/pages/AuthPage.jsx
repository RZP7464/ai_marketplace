import React, { useState } from 'react'
import apiService from '../services/api'

function AuthPage({ onLogin }) {
  const [activeTab, setActiveTab] = useState('login')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (activeTab === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const isSignup = activeTab === 'signup'
      
      if (isSignup) {
        // For signup, we need merchantId - for now create a flow that handles this
        // In production, you might create merchant first or use a different flow
        onLogin({ email: formData.email, name: formData.name }, true)
      } else {
        // Login with API
        const response = await apiService.login(formData.email, formData.password)
        
        if (response.success) {
          onLogin(response.data.user, false)
        } else {
          setApiError(response.error || 'Login failed')
        }
      }
    } catch (error) {
      setApiError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Decorative star */}
      <div className="absolute bottom-8 right-8">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-gray-600">
          <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="currentColor"/>
        </svg>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-5xl bg-[#252542] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 py-4 border-b border-white/5">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-white font-semibold tracking-wider text-sm">AGENTIC PLATFORM</span>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Hero */}
          <div className="lg:w-1/2 p-8 lg:p-12 relative bg-gradient-to-br from-[#1e1e3f] to-[#252542]">
            {/* Floating phones mockup */}
            <div className="relative h-64 lg:h-80 mb-8">
              {/* Phone 1 - Left */}
              <div className="absolute left-0 top-8 w-32 lg:w-40 h-56 lg:h-64 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl shadow-2xl transform -rotate-6 overflow-hidden border border-white/10 animate-float-left">
                <div className="absolute inset-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl overflow-hidden">
                  <div className="p-3">
                    <div className="flex gap-1 mb-3">
                      <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                      <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                      <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-white/30 rounded w-full"></div>
                      <div className="h-2 bg-white/20 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 2 - Center */}
              <div className="absolute left-1/2 top-0 w-36 lg:w-44 h-60 lg:h-72 bg-gradient-to-br from-green-900 to-emerald-800 rounded-2xl shadow-2xl z-10 overflow-hidden border border-white/10 animate-float-center">
                <div className="absolute inset-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl">🌿</div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2">
                      <div className="text-white text-xs font-medium">Bonsai Update</div>
                      <div className="text-white/60 text-[10px]">POPULAR CHOICES</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone 3 - Right */}
              <div className="absolute right-0 top-4 w-28 lg:w-36 h-52 lg:h-60 bg-gradient-to-br from-purple-900 to-indigo-800 rounded-2xl shadow-2xl transform rotate-6 overflow-hidden border border-white/10 animate-float-right">
                <div className="absolute inset-2 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl overflow-hidden flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🤖</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Text */}
            <div className="relative z-10">
              <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
                Unlock<br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Conversational
                </span><br />
                Commerce
              </h1>
              <p className="text-gray-400 text-sm">
                Log in to customize your AI agent and elevate sales.
              </p>
            </div>

            {/* Decorative grid pattern */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a1a2e]/50 to-transparent pointer-events-none">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:w-1/2 p-8 lg:p-12 bg-[#1e1e3f]">
            {/* Tab Switcher - Smooth Switch Bar */}
            <div className="relative inline-flex bg-[#2a2a4a] rounded-full p-1 mb-8">
              {/* Sliding Background */}
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg shadow-purple-500/30 transition-all duration-300 ease-out ${
                  activeTab === 'login' ? 'left-1' : 'left-[calc(50%+2px)]'
                }`}
              />
              
              {/* Login Button */}
              <button
                onClick={() => setActiveTab('login')}
                className={`relative z-10 px-8 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'login'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Log In
              </button>
              
              {/* Sign Up Button */}
              <button
                onClick={() => setActiveTab('signup')}
                className={`relative z-10 px-8 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 ${
                  activeTab === 'signup'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Welcome Text */}
            <h2 
              key={activeTab} 
              className="text-2xl font-bold text-white mb-6 animate-fade-slide"
            >
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div key={activeTab} className="space-y-4 animate-fade-slide">
              {activeTab === 'login' ? (
                /* Login Form */
                <>
                  <div>
                    <label className="block text-gray-400 text-xs mb-2">Work Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your work email"
                      className={`w-full px-4 py-3 bg-[#2a2a4a] border ${errors.email ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className={`w-full px-4 py-3 bg-[#2a2a4a] border ${errors.password ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                    />
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                  </div>

                  {apiError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                      {apiError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                      />
                      Remember me
                    </label>
                    <button type="button" className="text-gray-400 hover:text-white transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                </>
              ) : (
                /* Signup Form */
                <>
                  <div>
                    <label className="block text-gray-400 text-xs mb-2">Work Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your work email"
                      className={`w-full px-4 py-3 bg-[#2a2a4a] border ${errors.email ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a password"
                      className={`w-full px-4 py-3 bg-[#2a2a4a] border ${errors.password ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                    />
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs mb-2">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className={`w-full px-4 py-3 bg-[#2a2a4a] border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                    />
                    {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>

                  {apiError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                      {apiError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </button>

                  <p className="text-gray-500 text-xs text-center">
                    By signing up, you agree to our Terms of Service
                  </p>
                </>
              )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage

