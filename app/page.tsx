'use client'

import { useAuth } from './providers'
import Link from 'next/link'
import { ActivityFeed } from '@/components/ActivityFeed'

export default function Home() {
  const { user, login } = useAuth()

  return (
    <div className="max-w-screen-md mx-auto p-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Borrow from friends with one cast.
        </h1>
        <p className="text-lg text-gray-600 mb-3">
          Post → auction → repay. No contracts, no permission.
        </p>
        
        {/* Stats pill */}
        <div className="flex justify-center mb-8">
          <span className="text-sm bg-zinc-100 px-3 py-1 rounded-full">
            <span className="text-lg">🟢</span> 100% on-time · $789 funded
          </span>
        </div>
        
        {/* Single CTA */}
        {!user ? (
          <button
            onClick={login}
            className="bg-[#6936F5] hover:bg-[#5733d9] text-white rounded-full px-6 py-3 font-medium transition"
          >
            Start a LoanCast
          </button>
        ) : (
          <Link
            href="/loans/new"
            className="inline-block bg-[#6936F5] hover:bg-[#5733d9] text-white rounded-full px-6 py-3 font-medium transition"
          >
            Start a LoanCast
          </Link>
        )}
      </div>

      {/* Inline steps strip */}
      <div className="flex justify-between text-xs md:text-sm bg-zinc-100 rounded-xl py-2 px-4 mt-6 max-w-xl mx-auto">
        <div className="flex-1 text-center"><span className="text-lg">①</span> Post cast</div>
        <div className="flex-1 text-center border-l border-zinc-300"><span className="text-lg">②</span> Highest bid = loan</div>
        <div className="flex-1 text-center border-l border-zinc-300"><span className="text-lg">③</span> Repay +2%</div>
      </div>
      
      {/* Permissionless tag */}
      <p className="text-zinc-500 text-xs mt-2 text-center">
        <span className="text-lg">🔓</span> No KYC · No contracts · Powered by your Farcaster handle
      </p>

      {/* Live Activity Feed */}
      <div className="mt-16 max-w-2xl mx-auto">
        <ActivityFeed />
      </div>

      {/* Sample Cast Preview */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Example LoanCast</h2>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#6936F5]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-[#6936F5] rounded-full flex items-center justify-center text-white font-bold">
              LC
            </div>
            <div>
              <p className="font-semibold">LoanCast</p>
              <p className="text-sm text-gray-500">@loancast • now</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-line">
{`🏦 LOANCAST REQUEST

Amount: $500.00 USDC
Rate: 2% monthly (24% APR)
Repay: $520.00
Due: 9/4/2025

Fixed rate social lending on Farcaster.
Powered by @loancast`}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>💰 Collectible</span>
              <span>🔥 0 bids</span>
            </div>
            <span>Cast #eb9a9a</span>
          </div>
        </div>
        <p className="text-center text-gray-600 mt-4">
          Collectible loan casts
        </p>
      </div>
    </div>
  )
}