import React, { useState } from 'react'
import MerchantLogin from './pages/MerchantLogin'
import MerchantDashboard from './pages/MerchantDashboard'

function MerchantApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [merchantInfo, setMerchantInfo] = useState(null)

  const handleLogin = (info) => {
    setMerchantInfo(info)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setMerchantInfo(null)
  }

  return (
    <>
      {!isLoggedIn ? (
        <MerchantLogin onLogin={handleLogin} />
      ) : (
        <MerchantDashboard onLogout={handleLogout} merchantInfo={merchantInfo} />
      )}
    </>
  )
}

export default MerchantApp

