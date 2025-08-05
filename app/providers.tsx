'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  fid: number
  displayName: string
  pfpUrl?: string
  verifiedWallet?: string
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
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async () => {
    // Check if we have Neynar API key for real auth
    if (process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID) {
      // Open Neynar Sign In With Farcaster
      const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID
      const redirectUri = `${window.location.origin}/api/auth/callback`
      
      window.location.href = `https://app.neynar.com/login?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
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