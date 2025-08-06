'use client'

import { useAuth } from '../app/providers'
import { NeynarAuthWrapper } from './NeynarAuth'

export function AuthButton() {
  const { user, handleAuthSuccess, logout } = useAuth()

  return (
    <NeynarAuthWrapper
      onAuthSuccess={handleAuthSuccess}
      onLogout={logout}
      isLoggedIn={!!user}
      user={user}
    />
  )
}