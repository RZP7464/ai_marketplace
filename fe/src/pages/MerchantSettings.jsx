import React, { useState } from 'react'
import { Settings, Store, Code, ArrowLeft, LogOut, Save, Check } from 'lucide-react'
import BrandIdentity from './BrandIdentity'
import ApiConfiguration from './ApiConfiguration'

function MerchantSettings({ onLogout, initialBrandData, initialApiConfigs }) {
  const [activeTab, setActiveTab] = useState('brand') // 'brand' or 'api'
  const [brandData, setBrandData] = useState(initialBrandData || null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  // Navigate to dashboard
  const goToDashboard = () => {
    window.history.pushState({}, '', '/dashboard')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  // Handle brand identity updates (from the embedded component)
  const handleBrandUpdate = (data) => {
    setBrandData(data)
    setHasChanges(true)
    // In settings mode, don't navigate - just update data
  }

  // Handle API config updates
  const handleApiUpdate = (data) => {
    setHasChanges(true)
    // In settings mode, don't navigate - just update data
  }

  // Save all changes
  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      // TODO: Call API to save settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaveStatus('saved')
      setHasChanges(false)
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      setSaveStatus(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Settings Header - Fixed at top */}
      <header className="bg-[#252542] border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={goToDashboard} 
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-semibold">Merchant Settings</h1>
                  <p className="text-gray-500 text-xs">Configure your store and APIs</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-yellow-400 text-xs flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                  Unsaved changes
                </span>
              )}
              
              <button 
                onClick={handleSave} 
                disabled={!hasChanges || saveStatus === 'saving'}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  hasChanges 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/25' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              
              {onLogout && (
                <button 
                  onClick={onLogout} 
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-[#1e1e3f] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab('brand')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'brand' 
                  ? 'text-white border-purple-500' 
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              Brand Identity
            </button>
            <button 
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'api' 
                  ? 'text-white border-purple-500' 
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              API Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Content - Reuse existing components */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'brand' ? (
          <BrandIdentity 
            onNext={handleBrandUpdate}
            onBack={null}
            isSettingsMode={true}
            initialData={brandData}
          />
        ) : (
          <ApiConfiguration 
            onNext={handleApiUpdate}
            onBack={() => setActiveTab('brand')}
            brandData={brandData}
            isSettingsMode={true}
          />
        )}
      </div>
    </div>
  )
}

export default MerchantSettings
