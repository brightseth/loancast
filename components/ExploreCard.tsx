'use client'

import { Loan } from '@/lib/supabase'
import { format, formatDistanceToNow } from 'date-fns'
import { useBorrowerStats } from '@/hooks/useBorrowerStats'
import { useState, useEffect } from 'react'

interface ExploreCardProps {
  loan: Loan
}

export function ExploreCard({ loan }: ExploreCardProps) {
  const dueDate = new Date(loan.due_ts)
  const createdDate = new Date(loan.created_at)
  const apr = (loan.yield_bps || 0) / 100
  const isFunded = loan.status === 'funded'
  const isRepaid = loan.status === 'repaid'
  const castHashDisplay = `#${loan.cast_hash.slice(0, 8)}`
  
  // Check if loan is new (created within last 24 hours)
  const isNew = Date.now() - createdDate.getTime() < 24 * 60 * 60 * 1000
  
  // Get borrower stats for trust indicators (only for open loans)
  const shouldFetchStats = !isFunded && !isRepaid && loan.borrower_fid
  const { stats, loading: loadingCredit } = useBorrowerStats(shouldFetchStats ? loan.borrower_fid : null)
  
  // Get borrower info for displaying name
  const [borrowerName, setBorrowerName] = useState<string | null>(null)
  const [borrowerAvatar, setBorrowerAvatar] = useState<string | null>(null)
  const [loadingBorrower, setLoadingBorrower] = useState(false)

  useEffect(() => {
    if (!loan.borrower_fid) return

    const fetchBorrowerName = async () => {
      setLoadingBorrower(true)
      try {
        // Try borrower stats first (already has names from database)
        const statsResponse = await fetch(`/api/borrowers/${loan.borrower_fid}/stats`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          if (statsData.display_name) {
            setBorrowerName(statsData.display_name)
            setBorrowerAvatar(statsData.pfp_url)
            return
          }
        }
        
        // Fallback to basic display
        setBorrowerName(`User ${loan.borrower_fid}`)
      } catch (error) {
        console.error('Error fetching borrower name:', error)
        setBorrowerName(`User ${loan.borrower_fid}`)
      } finally {
        setLoadingBorrower(false)
      }
    }

    fetchBorrowerName()
  }, [loan.borrower_fid])
  
  // TODO: Replace with real user reputation data from users table
  // For now, show basic loan status without fake metrics
  const getRiskLevel = () => {
    // Simple risk based on loan amount and duration only
    const loanAmount = loan.gross_usdc || (loan.repay_usdc ? loan.repay_usdc / 1.02 : 0)
    if (loanAmount <= 10) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-50', icon: '🟢' }
    if (loanAmount <= 100) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '🟡' }
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-50', icon: '🔴' }
  }
  
  const risk = getRiskLevel()

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-4 sm:p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-mono text-gray-500 truncate">{castHashDisplay}</p>
            {isNew && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                NEW
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            ${(loan.repay_usdc || 0).toFixed(2)}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm text-gray-500">Total repayment</p>
            {borrowerName && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  {borrowerAvatar && (
                    <img 
                      src={borrowerAvatar} 
                      alt={borrowerName}
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {loadingBorrower ? 'Loading...' : borrowerName}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isRepaid
            ? 'bg-blue-100 text-blue-800'
            : isFunded 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isRepaid ? 'Repaid' : isFunded ? 'Funded' : 'Open'}
        </span>
      </div>

      {/* Trust Chips & Credit Score */}
      {!isFunded && !isRepaid && (
        <div className="mb-4 p-2">
          {loadingCredit ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              <span className="text-sm text-gray-500">Loading credit...</span>
            </div>
          ) : stats ? (
            <div className="flex flex-wrap gap-2">
              {/* Score/Tier Chip */}
              <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                Score {stats.score} / Tier {stats.tier}
              </span>
              
              {/* Repayment Rate Chip */}
              {stats.loans_total > 0 && (
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">
                  ✅ Repaid {stats.loans_repaid}/{stats.loans_total} on time {Math.round(stats.on_time_rate * 100)}%
                </span>
              )}
              
              {/* Streak Badge */}
              {stats.longest_on_time_streak > 1 && (
                <span className="rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-xs">
                  🔥 {stats.longest_on_time_streak} streak
                </span>
              )}
            </div>
          ) : (
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm">{risk.icon}</span>
                <span className={`text-sm font-medium ${risk.color}`}>{risk.level} Risk</span>
                <span className="text-xs text-gray-500">• Based on loan amount</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Risk Level - Only for funded/repaid loans */}
      {(isFunded || isRepaid) && (
        <div className="mb-4 p-3 rounded-lg border border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm">{risk.icon}</span>
            <span className={`text-sm font-medium ${risk.color}`}>{risk.level} Risk</span>
            <span className="text-xs text-gray-500">• Based on loan amount</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">APR</span>
          <span className="text-lg font-semibold text-farcaster">
            {apr.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Duration</span>
          <span className="text-sm font-medium">
            {formatDistanceToNow(dueDate, { addSuffix: false })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Due Date</span>
          <span className="text-sm font-medium">
            {format(dueDate, 'MMM dd, yyyy')}
          </span>
        </div>

        {loan.gross_usdc && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount Funded</span>
              <span className="text-sm font-medium">
                ${(loan.gross_usdc || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">Platform Fee</span>
              <span className="text-sm font-medium">
                ${(0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">📱 Farcaster Cast #{loan.cast_hash.slice(2, 8)}</p>
          <div className="bg-gray-50 rounded-md p-2 text-xs text-gray-700 border">
            🏦 ${(loan.repay_usdc && loan.yield_bps ? 
              ((loan.repay_usdc * 10000) / (10000 + loan.yield_bps)).toFixed(0) : '0')} USDC loan
            • 2% monthly • Due {format(dueDate, 'M/d')}
          </div>
        </div>
        {/* Action buttons - always at bottom of card */}
        <div className="flex gap-2 mt-auto">
          <a
            href={`https://warpcast.com/~/conversations/${loan.cast_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 py-2 px-3 sm:px-4 rounded-md font-medium transition text-center block text-sm ${
              isRepaid
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : isFunded 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : risk.level === 'Low'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : risk.level === 'Medium'
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isRepaid ? 'View Cast' : isFunded ? 'View Cast' : `Fund ${risk.level} Risk`}
          </a>
          <a
            href={`/profile/${loan.borrower_fid}`}
            className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-center flex items-center justify-center"
            title={`View FID ${loan.borrower_fid} profile`}
          >
            <span className="text-sm">👤</span>
          </a>
        </div>
      </div>
    </div>
  )
}