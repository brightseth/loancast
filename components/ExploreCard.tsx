'use client'

import { Loan } from '@/lib/supabase'
import { format, formatDistanceToNow } from 'date-fns'
import { useBorrowerStats } from '@/hooks/useBorrowerStats'
import { useState, useEffect } from 'react'
import { useToast } from './Toast'
import { useAuth } from '@/app/providers'

interface ExploreCardProps {
  loan: Loan & {
    borrower_kind?: 'human' | 'agent';
    borrower_score?: number;
  }
}

export function ExploreCard({ loan }: ExploreCardProps) {
  const { showToast } = useToast()
  const { user } = useAuth()
  const [autoFunding, setAutoFunding] = useState(false)
  
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
  
  // Agent performance stats
  const [agentStats, setAgentStats] = useState<any>(null)
  const [loadingAgentStats, setLoadingAgentStats] = useState(false)

  useEffect(() => {
    if (loan.borrower_kind === 'agent' && loan.borrower_fid && shouldFetchStats) {
      setLoadingAgentStats(true)
      fetch(`/api/agents/${loan.borrower_fid}/performance`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setAgentStats(data))
        .catch(() => setAgentStats(null))
        .finally(() => setLoadingAgentStats(false))
    }
  }, [loan.borrower_kind, loan.borrower_fid, shouldFetchStats])
  
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

  const tryAutoFund = async () => {
    if (!user?.fid || autoFunding) return
    
    setAutoFunding(true)
    try {
      const response = await fetch(`/api/loans/${loan.id}/auto-fund-human`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: user.fid })
      })
      
      const result = await response.json()
      
      if (response.ok && result.ok) {
        showToast(
          `✅ Auto-funded ${loan.borrower_kind === 'agent' ? 'agent' : 'human'} loan!\nYour funding intent has been recorded.`,
          'success'
        )
      } else {
        const reasons = result.reasons || ['Unknown error']
        const reasonMap: Record<string, string> = {
          'global_killswitch': 'Auto-funding is temporarily disabled',
          'counterparty_not_allowed': 'This borrower type is not allowed in your settings',
          'score_too_low': 'Borrower credit score is below your minimum',
          'amount_too_high': 'Loan amount exceeds your maximum per-loan limit',
          'duration_too_long': 'Loan duration exceeds your maximum',
          'daily_limit_exceeded': 'Your daily funding limit has been reached',
          'per_counterparty_exceeded': 'You have reached your daily limit for this borrower',
          'strategy_mismatch': 'Loan does not match your funding strategy',
          'autolend_disabled': 'Auto-funding is disabled in your settings',
          'borrower_daily_loan_limit_exceeded': 'This borrower has reached their daily loan limit (fairness protection)',
          'borrower_daily_amount_limit_exceeded': 'This borrower has reached their daily funding limit (fairness protection)'
        }
        
        const friendlyReasons = reasons.map((r: string) => {
          // Handle holdback window messages specially
          if (r.startsWith('holdback_window_active_')) {
            const match = r.match(/holdback_window_active_(\d+)min/);
            const minutes = match ? match[1] : '?';
            return `Manual funders get priority for ${minutes} more minutes`;
          }
          return reasonMap[r] || r.replace(/_/g, ' ');
        }).join('\n• ')
        
        showToast(
          `❌ Auto-fund declined:\n• ${friendlyReasons}\n\nUpdate your settings in the lending dashboard or fund manually.`,
          'error',
          8000
        )
      }
    } catch (error) {
      console.error('Auto-fund error:', error)
      showToast('❌ Auto-fund failed due to a network error', 'error')
    } finally {
      setAutoFunding(false)
    }
  }

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

      {/* Borrower Type & Trust Indicators */}
      {!isFunded && !isRepaid && (
        <div className="mb-4 p-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
              Borrower: {loan.borrower_type === 'agent' ? 'Agent 🤖' : 'Human 👤'}
            </span>
          </div>

          {loadingCredit || loadingAgentStats ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              <span className="text-sm text-gray-500">Loading credit...</span>
            </div>
          ) : loan.borrower_kind === 'human' && stats ? (
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
          ) : loan.borrower_kind === 'agent' && agentStats ? (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs">
                🤖 Score {agentStats.score ?? '—'} · Defaults {(agentStats.default_rate_bps ?? 0)/100}%
              </span>
              {agentStats.loans_funded > 0 && (
                <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-xs">
                  Funded {agentStats.loans_funded} loans
                </span>
              )}
            </div>
          ) : loan.borrower_score ? (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold">
                Score {loan.borrower_score}
              </span>
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
              <span className="text-sm text-gray-600">Platform Fee (10%)</span>
              <span className="text-sm font-medium">
                ${((loan.gross_usdc || 0) * 0.1).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">📱 Farcaster Cast #{loan.cast_hash.slice(2, 8)}</p>
          <div className="bg-gray-50 rounded-md p-2 text-xs text-gray-700 border">
            🏦 ${loan.gross_usdc || '0'} USDC loan
            • 2% monthly • Due {format(dueDate, 'M/d')}
          </div>
        </div>
        {/* Action buttons - always at bottom of card */}
        <div className="flex gap-2 mt-auto">
          {!isFunded && !isRepaid && user?.fid && (
            <button
              onClick={tryAutoFund}
              disabled={autoFunding}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Try auto-fund based on your preferences"
            >
              {autoFunding ? '⏳' : '🚀'} Auto
            </button>
          )}
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