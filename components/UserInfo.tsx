'use client'

import { useState, useEffect } from 'react'
import { truncateAddress } from '../lib/utils'

interface UserInfoProps {
  user?: {
    fid: number
    display_name: string
    pfp_url?: string
    verified_wallet?: string
  }
}

export function UserInfo({ user }: UserInfoProps) {
  if (!user) return null

  return (
    <div className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-lg">
      {user.pfp_url && (
        <img 
          src={user.pfp_url} 
          alt={user.display_name}
          className="w-8 h-8 rounded-full"
        />
      )}
      <div className="flex flex-col text-sm">
        <span className="font-medium text-gray-900">
          {user.display_name}
        </span>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>FID: {user.fid}</span>
          {user.verified_wallet && (
            <>
              <span>•</span>
              <span title={user.verified_wallet}>
                {truncateAddress(user.verified_wallet)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}