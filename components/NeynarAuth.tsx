'use client'

import { useState, useEffect } from 'react'

interface NeynarAuthProps {
  onAuthSuccess: (userData: any) => void
  onLogout: () => void
  isLoggedIn: boolean
  user?: any
}

export function NeynarAuth({ onAuthSuccess, onLogout, isLoggedIn, user }: NeynarAuthProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render until client-side to avoid hydration issues
  if (!isClient) {
    return (
      <button className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed">
        Loading...
      </button>
    )
  }

  if (isLoggedIn && user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {user.pfpUrl && (
            <img 
              src={user.pfpUrl} 
              alt="Profile" 
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  // Check if we have a Neynar client ID configured
  const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID
  
  if (!clientId || clientId === 'your_neynar_client_id_here') {
    // Fall back to mock auth for development
    return (
      <button
        onClick={() => {
          const mockUser = {
            fid: 12345,
            displayName: 'Test User',
            pfpUrl: 'https://i.pravatar.cc/64?img=1',
            verifiedWallet: '0x0196F2aB8b1d12345a06e5123456789abcdef123'
          }
          onAuthSuccess(mockUser)
        }}
        className="bg-[#6936F5] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
      >
        Sign In (Mock)
      </button>
    )
  }

  // For now, use the vanilla SIWN script approach which is known to work
  const handleNeynarAuth = () => {
    // Load Neynar SIWN script if not already loaded
    if (!document.querySelector('script[src*="neynarxyz.github.io/siwn"]')) {
      const script = document.createElement('script')
      script.src = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js'
      script.async = true
      document.head.appendChild(script)
    }

    // Create SIWN element
    const siwn = document.createElement('div')
    siwn.className = 'neynar_signin'
    siwn.setAttribute('data-client_id', clientId)
    siwn.setAttribute('data-success-callback', 'onNeynarSignInSuccess')
    siwn.setAttribute('data-theme', 'light')
    siwn.style.display = 'none'
    document.body.appendChild(siwn)

    // Define success callback
    ;(window as any).onNeynarSignInSuccess = (data: any) => {
      console.log('SIWN success:', data)
      onAuthSuccess(data)
      document.body.removeChild(siwn)
    }

    // Trigger authentication
    setTimeout(() => {
      const button = siwn.querySelector('button')
      if (button) {
        button.click()
      }
    }, 100)
  }

  return (
    <button
      onClick={handleNeynarAuth}
      className="bg-[#6936F5] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
    >
      Connect Farcaster
    </button>
  )
}

// Wrapper component 
export function NeynarAuthWrapper({ children, onAuthSuccess, onLogout, isLoggedIn, user }: 
  { children?: React.ReactNode } & NeynarAuthProps
) {
  return (
    <NeynarAuth onAuthSuccess={onAuthSuccess} onLogout={onLogout} isLoggedIn={isLoggedIn} user={user} />
  )
}