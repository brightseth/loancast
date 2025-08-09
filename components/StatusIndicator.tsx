'use client'

import { Loan } from '@/lib/supabase'
import { addDays, differenceInHours, isPast } from 'date-fns'
import { useState } from 'react'
import { useAuth } from '@/app/providers'

interface StatusIndicatorProps {
  loan: Loan
}

export function StatusIndicator({ loan }: StatusIndicatorProps) {
  const { user } = useAuth()
  const [funding, setFunding] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Mock funding data - in production this would come from bids/funding table
  const targetAmount = Number(BigInt(loan.repay_expected_usdc || '0')) / 1e6 || 0
  const fundedAmount = Number(BigInt(loan.amount_usdc || '0')) / 1e6 || 0
  const fundingProgress = targetAmount > 0 ? (fundedAmount / targetAmount) * 100 : 0
  
  // Calculate time left for funding (24h from creation)
  const createdAt = new Date(loan.created_at)
  const fundingDeadline = addDays(createdAt, 1)
  const hoursLeft = differenceInHours(fundingDeadline, new Date())
  const isExpired = isPast(fundingDeadline)
  
  // Mock bid count
  const bidCount = Math.floor(fundingProgress / 15) + 1

  const handleFunding = async (amount: number) => {
    if (!user || funding) return
    
    setFunding(true)
    try {
      const response = await fetch(`/api/loans/${loan.id}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          lenderFid: user.fid,
          txHash: `mock_tx_${Date.now()}` // Mock transaction hash
        }),
      })

      if (response.ok) {
        // Refresh the page to show updated funding
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Funding failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Funding error:', error)
      alert('Funding failed. Please try again.')
    } finally {
      setFunding(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/loans/${loan.id}`
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  if (loan.status !== 'open') {
    return null
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
      <div className="space-y-2">
        {/* Funding Progress */}
        <div>
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>Funding Progress</span>
            <span className="font-medium">${fundedAmount.toFixed(0)}/${targetAmount.toFixed(0)} ({fundingProgress.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#6936F5] h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(fundingProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Time & Bids */}
        <div className="flex justify-between items-center text-xs">
          <span className={`font-medium ${isExpired ? 'text-red-600' : hoursLeft < 6 ? 'text-orange-600' : 'text-gray-600'}`}>
            {isExpired ? 'Funding expired' : `${hoursLeft}h left to fund`}
          </span>
          <span className="text-gray-500">
            {bidCount} bid{bidCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Quick Actions for unfunded loans */}
        {fundingProgress < 100 && !isExpired && user && (
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button 
              onClick={() => handleFunding(50)}
              disabled={funding}
              className="flex-1 text-xs bg-[#6936F5] text-white py-1.5 px-3 rounded font-medium hover:bg-[#5929cc] transition disabled:opacity-50"
            >
              {funding ? '...' : 'Fund $50'}
            </button>
            <button 
              onClick={() => handleFunding(100)}
              disabled={funding}
              className="flex-1 text-xs bg-[#EAE9FE] text-[#6936F5] py-1.5 px-3 rounded font-medium hover:bg-[#DDD6FE] transition disabled:opacity-50"
            >
              {funding ? '...' : 'Fund $100'}
            </button>
            <button 
              onClick={handleCopyLink}
              className="text-xs text-gray-500 hover:text-gray-700 py-1.5 px-2 rounded transition"
              title="Copy link"
            >
              {linkCopied ? '✅' : '📋'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}