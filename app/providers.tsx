'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

declare global {
  interface Window {
    neynarSIWNLoaded?: boolean
    onNeynarSignInSuccess?: (data: any) => void
    neynar?: {
      signIn: () => void
    }
  }
}

interface User {
  fid: number
  displayName: string
  pfpUrl?: string
  verifiedWallet?: string
  signerUuid?: string
}

interface AuthContextType {
  user: User | null
  login: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
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
      }
    }
  }, [])

  const login = async () => {
    // Check if we have Neynar API key for real auth
    if (process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID) {
      // Load Neynar SIWN script and trigger sign-in
      if (!window.neynarSIWNLoaded) {
        const script = document.createElement('script')
        script.src = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js'
        script.async = true
        document.head.appendChild(script)
        window.neynarSIWNLoaded = true
      }
      
      // Create SIWN element and trigger
      const siwn = document.createElement('div')
      siwn.className = 'neynar_signin'
      siwn.setAttribute('data-client_id', process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID)
      siwn.setAttribute('data-success-callback', 'onNeynarSignInSuccess')
      siwn.setAttribute('data-theme', 'light')
      siwn.style.display = 'none'
      document.body.appendChild(siwn)
      
      // Define success callback
      window.onNeynarSignInSuccess = (data: any) => {
        console.log('SIWN success:', data)
        const user = {
          fid: Number(data.fid),
          displayName: data.user.display_name,
          pfpUrl: data.user.pfp_url,
          verifiedWallet: data.user.verified_addresses?.eth_addresses?.[0] || null,
          signerUuid: data.signer_uuid
        }
        setUser(user)
        localStorage.setItem('user', JSON.stringify(user))
        document.body.removeChild(siwn)
      }
      
      // Trigger click after script loads
      setTimeout(() => {
        const button = siwn.querySelector('button')
        if (button) {
          button.click()
        } else {
          // Fallback - trigger SIWN manually
          if (window.neynar) {
            window.neynar.signIn()
          }
        }
      }, 100)
    } else {
      // Mock login for development
      const mockUser = {
        fid: 12345,
        displayName: 'Test User',
        pfpUrl: 'https://i.pravatar.cc/64?img=1',
        verifiedWallet: '0x0196F2aB8b1d12345a06e5123456789abcdef123'
      }
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}