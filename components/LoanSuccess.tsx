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

  // Detect if this is a real cast vs mock
  const isRealCast = loan.cast_hash && 
    !loan.cast_hash.includes('mock-') && 
    !loan.cast_hash.includes('failed-') &&
    loan.cast_hash.length > 20

  const isMockCast = loan.cast_hash?.includes('mock-')
  const isFailedCast = loan.cast_hash?.includes('failed-')

  const shareText = `${isRealCast ? 'Cast posted. Auction live for 24 h.' : 'Ready to post your LoanCast!'}

💰 Just ${isRealCast ? 'posted' : 'created'} a $${loan.amount} LoanCast
🚀 View and bid: ${process.env.NEXT_PUBLIC_APP_URL || 'https://loancast.app'}/loans/${loan.id}

${isRealCast ? 'Recast to /loancast' : 'Post to Farcaster to start the auction!'}`

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
          message={isRealCast ? "LoanCast posted to Farcaster 🎉" : isMockCast ? "LoanCast created (mock mode) ⚡" : "LoanCast created 🎯"}
          type={isRealCast ? "success" : "info"}
          onClose={() => setShowSnackBar(false)}
        />
      )}
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className={`w-16 h-16 ${isRealCast ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {isRealCast ? (
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isRealCast ? 'Cast posted to Farcaster!' : 
           isFailedCast ? 'Loan created (cast failed)' : 
           isMockCast ? 'Loan created (dev mode)' : 'Loan created successfully!'}
        </h2>
        <p className="text-gray-600">
          {isRealCast ? 'Auction is now live for 24 hours' : 
           isFailedCast ? 'Manual posting required - see below' :
           isMockCast ? 'Development mode - no real cast posted' :
           'Ready to post to Farcaster to start auction'}
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
        {isRealCast && loan.cast_url ? (
          <a
            href={loan.cast_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#6936F5] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#5929cc] transition flex items-center justify-center space-x-2 block"
          >
            <span>✅</span>
            <span>View on Farcaster</span>
          </a>
        ) : isRealCast ? (
          <div className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2">
            <span>🎉</span>
            <span>Posted to Farcaster</span>
          </div>
        ) : (
          <button
            onClick={shareOnWarpcast}
            className="w-full bg-[#6936F5] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#5929cc] transition flex items-center justify-center space-x-2"
          >
            <span>{isFailedCast ? '🔄' : '📤'}</span>
            <span>{isFailedCast ? 'Retry Post to Farcaster' : 'Post to Farcaster'}</span>
          </button>
        )}
        
        {isFailedCast && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Cast posting failed.</strong> Use the button above to manually post your LoanCast to start the auction.
            </p>
          </div>
        )}
        
        {isMockCast && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Development mode.</strong> In production, this would be automatically posted to Farcaster.
            </p>
          </div>
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