'use client'

import { useAuth } from '../app/providers'
import { UserInfo } from './UserInfo'

export function AuthButton() {
  const { user, login, logout } = useAuth()

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <UserInfo 
          user={{
            fid: user.fid,
            display_name: user.displayName,
            pfp_url: user.pfpUrl,
            verified_wallet: user.verifiedWallet
          }} 
        />
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={login}
      className="bg-[#6936F5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5929cc] transition-colors"
    >
      Connect Farcaster
    </button>
  )
}