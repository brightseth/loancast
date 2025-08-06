'use client'

import { useAuth } from '@/app/providers'
import { NotificationBell } from './NotificationBell'

export function NotificationBellWrapper() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return <NotificationBell userFid={user.fid} />
}