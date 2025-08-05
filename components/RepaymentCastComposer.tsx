'use client'

import { useState } from 'react'
import { Loan } from '@/lib/supabase'
import { format } from 'date-fns'

interface RepaymentCastComposerProps {
  loan: Loan
  verification: any
  onCastPosted: () => void
  onSkip: () => void
}

export function RepaymentCastComposer({ 
  loan, 
  verification, 
  onCastPosted, 
  onSkip 
}: RepaymentCastComposerProps) {
  const [posting, setPosting] = useState(false)
  const [copied, setCopied] = useState(false)

  const repaymentCastText = `✅ REPAYMENT COMPLETE

💰 Repaid $${loan.repay_usdc?.toFixed(0)} USDC loan
📅 On time: ${format(new Date(loan.due_ts), 'M/d/yyyy')}
🔗 TX: ${verification.txHash.slice(0, 10)}...

Building reputation on LoanCast.
Social lending powered by @loancast`

  const handlePostCast = async () => {
    setPosting(true)
    
    try {
      // In production, this would post to Farcaster via Neynar
      // For now, we'll simulate the post
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      onCastPosted()
    } catch (error) {
      console.error('Failed to post cast:', error)
      setPosting(false)
    }
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(repaymentCastText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const shareOnWarpcast = () => {
    const encodedText = encodeURIComponent(repaymentCastText)
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedText}`
    window.open(warpcastUrl, '_blank')
    onCastPosted()
  }

  return (
    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <h4 className="font-medium text-green-900 mb-3">
        Share your successful repayment
      </h4>
      
      <div className="bg-white border border-green-200 rounded-lg p-3 mb-4">
        <div className="text-sm font-mono whitespace-pre-line text-gray-800">
          {repaymentCastText}
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <button
          onClick={shareOnWarpcast}
          disabled={posting}
          className="w-full bg-[#6936F5] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#5929cc] transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <span>🔄</span>
          <span>{posting ? 'Posting...' : 'Post to Warpcast'}</span>
        </button>

        <button
          onClick={copyText}
          className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          {copied ? 'Copied!' : 'Copy Text'}
        </button>

        <button
          onClick={onSkip}
          className="w-full text-gray-500 py-1 px-4 rounded-lg font-medium hover:text-gray-700 transition text-sm"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}