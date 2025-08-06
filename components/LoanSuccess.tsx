'use client'

import { useState, useEffect } from 'react'
import { SnackBar } from './SnackBar'

interface LoanSuccessProps {
  loan: {
    id: string
    cast_hash: string
    cast_url?: string
    amount: number
    repay_usdc: number
    due_ts: string
  }
  onNewLoan: () => void
}

export function LoanSuccess({ loan, onNewLoan }: LoanSuccessProps) {
  const [copied, setCopied] = useState(false)
  const [showSnackBar, setShowSnackBar] = useState(true)

  const shareText = `Cast posted. Auction live for 24 h.

💰 Just posted a $${loan.amount} LoanCast
🚀 View and bid: https://loancast-fb7nwprwz-edenprojects.vercel.app/loans/${loan.id}

Recast to /loancast`

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const shareOnWarpcast = () => {
    const encodedText = encodeURIComponent(shareText)
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedText}`
    window.open(warpcastUrl, '_blank')
  }

  return (
    <>
      {showSnackBar && (
        <SnackBar 
          message="LoanCast posted 🎉"
          type="success"
          onClose={() => setShowSnackBar(false)}
        />
      )}
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {loan.cast_url ? 'Cast posted automatically!' : 'Loan created successfully!'}
        </h2>
        <p className="text-gray-600">
          {loan.cast_url ? 'Auction live for 24 h' : 'Ready to post on Farcaster'}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Cast Hash</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(loan.cast_hash)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="text-xs text-[#6936F5] hover:underline"
          >
            Copy
          </button>
        </div>
        <code className="text-xs text-gray-800 font-mono break-all">
          {loan.cast_hash}
        </code>
      </div>

      <div className="space-y-3">
        {loan.cast_url ? (
          <a
            href={loan.cast_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#6936F5] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#5929cc] transition flex items-center justify-center space-x-2 block"
          >
            <span>✅</span>
            <span>View on Farcaster</span>
          </a>
        ) : (
          <button
            onClick={shareOnWarpcast}
            className="w-full bg-[#6936F5] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#5929cc] transition flex items-center justify-center space-x-2"
          >
            <span>🔄</span>
            <span>Post to Farcaster</span>
          </button>
        )}

        <button
          onClick={copyShareText}
          className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          {copied ? 'Copied' : 'Copy Share Text'}
        </button>

        <button
          onClick={onNewLoan}
          className="w-full text-[#6936F5] py-2 px-4 rounded-lg font-medium hover:bg-[#6936F5]/5 transition"
        >
          New LoanCast
        </button>
      </div>

      <div className="mt-6 text-center">
        <a
          href={`/loans/${loan.id}`}
          className="text-sm text-gray-500 hover:text-[#6936F5] transition"
        >
          View loan details →
        </a>
      </div>
    </div>
    </>
  )
}