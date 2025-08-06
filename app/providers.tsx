'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import { analytics } from '@/lib/analytics'

interface User {
  fid: number
  displayName: string
  pfpUrl?: string
  verifiedWallet?: string
  signerUuid?: string
}

interface AuthContextType {
  user: User | null
  handleAuthSuccess: (userData: any) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  handleAuthSuccess: () => {},
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for auth success from callback
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get('auth_success')
    
    if (authSuccess) {
      try {
        const userData = JSON.parse(decodeURIComponent(authSuccess))
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('Auth success parsing error:', error)
      }
    } else {
      // Check localStorage for existing user
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        // Ensure FID is a number
        if (parsedUser.fid) {
          parsedUser.fid = Number(parsedUser.fid)
        }
        setUser(parsedUser)
        
        // Identify user for analytics
        analytics.identify(parsedUser.fid.toString(), {
          display_name: parsedUser.displayName,
          verified_wallet: parsedUser.verifiedWallet,
          has_signer: !!parsedUser.signerUuid,
        })
      }
    }
  }, [])

  const handleAuthSuccess = (userData: any) => {
    let user: User
    
    // Handle data from Neynar SDK vs mock auth
    if (userData.signer_uuid) {
      // Neynar SDK format
      user = {
        fid: Number(userData.fid),
        displayName: userData.user.display_name,
        pfpUrl: userData.user.pfp_url,
        verifiedWallet: userData.user.verified_addresses?.eth_addresses?.[0] || null,
        signerUuid: userData.signer_uuid
      }
      
      analytics.identify(user.fid.toString(), {
        display_name: user.displayName,
        verified_wallet: user.verifiedWallet,
        has_signer: !!user.signerUuid,
        login_method: 'neynar'
      })
      analytics.track('User Logged In', { method: 'neynar' })
    } else {
      // Mock auth format
      user = userData
      analytics.identify(user.fid.toString(), {
        display_name: user.displayName,
        verified_wallet: user.verifiedWallet,
        login_method: 'mock'
      })
      analytics.track('User Logged In', { method: 'mock' })
    }
    
    setUser(user)
    localStorage.setItem('user', JSON.stringify(user))
  }

  const logout = () => {
    analytics.track('User Logged Out')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, handleAuthSuccess, logout }}>
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
    </AuthContext.Provider>
  )
}