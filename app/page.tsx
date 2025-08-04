'use client'

import { useAuth } from './providers'
import Link from 'next/link'

export default function Home() {
  const { user, login } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Social Lending on Farcaster
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Make raising and tracking social-credit loans one tap
        </p>
        
        {!user ? (
          <button
            onClick={login}
            className="bg-farcaster text-white px-6 py-3 rounded-lg font-medium hover:bg-farcaster-dark transition"
          >
            Sign in with Farcaster
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700">Welcome back, {user.displayName}!</p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/loans/new"
                className="bg-farcaster text-white px-6 py-3 rounded-lg font-medium hover:bg-farcaster-dark transition"
              >
                Create Loan Request
              </Link>
              <Link
                href="/loans"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                My Loans
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">1. Request a Loan</h3>
          <p className="text-gray-600">
            Fill out a simple form with amount and term length
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">2. Cast Goes Live</h3>
          <p className="text-gray-600">
            Your loan request becomes a collectible cast on Farcaster
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">3. Track & Repay</h3>
          <p className="text-gray-600">
            Monitor your loan status and mark as repaid when complete
          </p>
        </div>
      </div>

      {/* Sample Cast Preview */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Example LoanCast</h2>
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-farcaster">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-farcaster rounded-full flex items-center justify-center text-white font-bold">
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
          This is how your loan request appears on Farcaster as a collectible cast
        </p>
      </div>
    </div>
  )
}