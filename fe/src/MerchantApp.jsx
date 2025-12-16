import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import MerchantLogin from './pages/MerchantLogin'
import MerchantDashboard from './pages/MerchantDashboard'

function MerchantApp({ onBack }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [merchantInfo, setMerchantInfo] = useState(null)

  const handleLogin = (info) => {
    setMerchantInfo(info)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setMerchantInfo(null)
    if (onBack) {
      onBack()
    }
  }

  return (
    <>
      {!isLoggedIn ? (
        <div className="relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Shopping
            </button>
          )}
          <MerchantLogin onLogin={handleLogin} />
        </div>
      ) : (
        <MerchantDashboard onLogout={handleLogout} merchantInfo={merchantInfo} />
      )}
    </>
  )
}

export default MerchantApp

