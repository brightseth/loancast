'use client'

import { User } from '@/lib/supabase'
import { Shield, TrendingUp, AlertCircle, Award } from 'lucide-react'

interface ReputationProfileProps {
  user: User
  isCompact?: boolean
}

export function ReputationProfile({ user, isCompact = false }: ReputationProfileProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    if (score >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', icon: '🏆' }
    if (score >= 60) return { label: 'Good', icon: '✅' }
    if (score >= 40) return { label: 'Fair', icon: '⚠️' }
    return { label: 'Building', icon: '🔨' }
  }

  const repaymentRate = user.total_loans > 0 
    ? ((user.loans_repaid / user.total_loans) * 100).toFixed(0)
    : 'N/A'

  const trustLevel = getTrustLevel(user.credit_score)

  if (isCompact) {
    return (
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(user.credit_score)}`}>
          {trustLevel.icon} {user.credit_score}% Score
        </span>
        {user.repayment_streak > 3 && (
          <span className="text-orange-500">🔥{user.repayment_streak}</span>
        )}
        {user.loans_repaid >= 10 && (
          <span title="10+ loans repaid">🎖️</span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-farcaster" />
            Reputation Profile
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Social credit score based on loan history
          </p>
        </div>
        <div className={`px-3 py-2 rounded-lg ${getScoreColor(user.credit_score)}`}>
          <div className="text-2xl font-bold">{user.credit_score}</div>
          <div className="text-xs">{trustLevel.label}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Loan History</p>
            <p className="text-lg font-semibold">{user.loans_repaid}/{user.total_loans}</p>
            <p className="text-xs text-gray-600">Loans repaid</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Repayment Rate</p>
            <p className="text-lg font-semibold">{repaymentRate}%</p>
            <p className="text-xs text-gray-600">On-time payments</p>
          </div>

          {user.repayment_streak > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current Streak</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                🔥 {user.repayment_streak}
              </p>
              <p className="text-xs text-gray-600">Consecutive repayments</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Volume</p>
            <p className="text-lg font-semibold">${user.total_borrowed?.toFixed(0) || 0}</p>
            <p className="text-xs text-gray-600">USDC borrowed</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Repayment</p>
            <p className="text-lg font-semibold">
              {user.avg_repayment_days ? `${user.avg_repayment_days.toFixed(0)} days` : 'N/A'}
            </p>
            <p className="text-xs text-gray-600">Time to repay</p>
          </div>

          {user.loans_defaulted > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Defaults</p>
              <p className="text-lg font-semibold text-red-600">{user.loans_defaulted}</p>
              <p className="text-xs text-gray-600">Total defaults</p>
            </div>
          )}
        </div>
      </div>

      {/* Social Metrics */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Social Capital</p>
        <div className="flex items-center gap-4 text-sm">
          {user.follower_count && (
            <div className="flex items-center gap-1">
              <span className="font-medium">{user.follower_count.toLocaleString()}</span>
              <span className="text-gray-600">followers</span>
            </div>
          )}
          {user.cast_count && (
            <div className="flex items-center gap-1">
              <span className="font-medium">{user.cast_count.toLocaleString()}</span>
              <span className="text-gray-600">casts</span>
            </div>
          )}
          {user.verified_wallet && (
            <div className="flex items-center gap-1 text-green-600">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Reputation Badges */}
      {user.reputation_badges && user.reputation_badges.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Achievements</p>
          <div className="flex flex-wrap gap-2">
            {(user.reputation_badges as any[]).map((badge, i) => (
              <span key={i} className="px-2 py-1 bg-farcaster/10 text-farcaster rounded-full text-xs font-medium">
                {badge.icon} {badge.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Risk Warning */}
      {user.credit_score < 40 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
          <div className="text-xs text-red-800">
            <p className="font-medium">Higher Risk Profile</p>
            <p>This borrower is still building their reputation. Consider starting with smaller amounts.</p>
          </div>
        </div>
      )}
    </div>
  )
}