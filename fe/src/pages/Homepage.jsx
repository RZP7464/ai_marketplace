import React, { useState, useEffect } from 'react'
import { 
  Sparkles, 
  MessageSquare, 
  CreditCard, 
  Zap, 
  ArrowRight, 
  CheckCircle, 
  Store, 
  ShoppingCart, 
  Bot, 
  Plug,
  ChevronRight,
  Play,
  Shield,
  Globe,
  Code
} from 'lucide-react'

const Homepage = ({ onGetStarted, onLogin }) => {
  const [activeFeature, setActiveFeature] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Shopping',
      description: 'ChatGPT-like conversational interface that understands your customers',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: CreditCard,
      title: 'Razorpay Integrated',
      description: 'Seamless checkout experience with Razorpay already built-in',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Plug,
      title: 'MCP Connect',
      description: 'Connect your APIs in minutes. No code changes required.',
      color: 'from-emerald-500 to-teal-500'
    }
  ]

  const steps = [
    { number: '01', title: 'Sign Up', description: 'Create your merchant account in seconds', icon: Store },
    { number: '02', title: 'Configure Brand', description: 'Set up your brand identity and colors', icon: Sparkles },
    { number: '03', title: 'Connect APIs', description: 'Link your product catalog and cart APIs', icon: Plug },
    { number: '04', title: 'Go Live', description: 'Start selling with AI-powered conversations', icon: Zap }
  ]

  const stats = [
    { value: '10x', label: 'Faster Integration' },
    { value: '24/7', label: 'AI Assistance' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '0', label: 'Code Required' }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              AgenticAI
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="px-5 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Login
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative z-10 px-6 pt-16 pb-24 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Powered by AI & Razorpay</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Turn Conversations
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Into Conversions
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                Integrate AI-powered shopping assistant with built-in Razorpay checkout. 
                Connect your MCP, configure your brand, and go live in minutes.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={onGetStarted}
                  className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] transition-all duration-300"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="group flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>PCI Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Code className="w-4 h-4 text-purple-400" />
                  <span>No-Code Setup</span>
                </div>
              </div>
            </div>

            {/* Right Content - Interactive Demo */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Shopping Assistant</h3>
                      <p className="text-xs text-green-400">● Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-6 space-y-4 h-[300px] overflow-hidden">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/5 rounded-2xl rounded-tl-none px-4 py-3 max-w-[280px]">
                      <p className="text-sm text-gray-300">Hi! I'm your shopping assistant. What are you looking for today?</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl rounded-tr-none px-4 py-3 max-w-[280px]">
                      <p className="text-sm text-white">Show me sneakers under $100</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/5 rounded-2xl rounded-tl-none px-4 py-3">
                      <p className="text-sm text-gray-300 mb-3">Found 3 great options for you! 🎉</p>
                      <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-gray-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="px-6 py-4 border-t border-white/10 bg-[#0f0f1f]">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Ask me anything..."
                      disabled
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none"
                    />
                    <button className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -bottom-6 -left-6 bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">Payment Successful!</span>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 shadow-xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium">AI Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Sell Smarter</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A complete AI shopping solution with payments built-in. No complex integrations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative p-8 rounded-2xl border transition-all duration-500 cursor-pointer ${
                  activeFeature === index
                    ? 'bg-white/5 border-purple-500/50 scale-105'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-white/20'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
                
                {activeFeature === index && (
                  <div className="absolute -inset-px bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-sm -z-10"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 py-24 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Get Started in
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> 4 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From signup to selling in minutes. No developers needed.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-40px)] h-[2px]">
                    <div className="w-full h-full bg-gradient-to-r from-purple-500/50 via-purple-500/30 to-transparent"></div>
                  </div>
                )}
                <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 hover:bg-[#1e1e3f] hover:border-purple-500/30 transition-all duration-300 h-full">
                  {/* Step Number Badge */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className="text-3xl font-bold text-purple-500/30">{step.number}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Partners */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gray-400 text-lg">Trusted by leading brands</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-16">
            <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-[#2D7FF9] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-2xl font-bold text-white">Razorpay</span>
            </div>
            <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-white">Tira</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-3xl p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Store?</h2>
              <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
                Join thousands of merchants using AI to boost sales and customer satisfaction.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={onGetStarted}
                  className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] transition-all duration-300"
                >
                  Get Started Now
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white/10 border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all">
                  Contact Us
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Quick setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No coding required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Instant deployment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">AgenticAI</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>

            <p className="text-sm text-gray-500">
              © 2024 AgenticAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Homepage

