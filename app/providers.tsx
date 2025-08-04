'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  fid: number
  displayName: string
  pfpUrl?: string
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
    // Mock login for development
    const mockUser = {
      fid: 12345,
      displayName: 'Test User',
      pfpUrl: 'https://via.placeholder.com/64'
    }
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
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