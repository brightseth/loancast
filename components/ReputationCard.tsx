'use client'

import { useEffect, useState } from 'react'
import { UserReputation, reputationService } from '@/lib/reputation'
import { ReputationBadges } from './ReputationBadges'

interface ReputationCardProps {
  userFid: number
  className?: string
  compact?: boolean
}

export function ReputationCard({ userFid, className = '', compact = false }: ReputationCardProps) {
  const [reputation, setReputation] = useState<UserReputation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const response = await fetch(`/api/reputation/${userFid}`)
        if (response.ok) {
          const data = await response.json()
          setReputation(data)
        } else {
          setError('Failed to load reputation')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchReputation()
  }, [userFid])

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !reputation) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">{error || 'No reputation data available'}</p>
        </div>
      </div>
    )
  }

  const colors = reputationService.getReputationColors(reputation.reputation_tier)
  const tierInfo = reputationService.getTierInfo(reputation.reputation_tier)

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} ${colors.text} text-sm font-medium ${className}`}>
        <span>{tierInfo.icon}</span>
        <span>{reputation.credit_score}</span>
        <span className="text-xs opacity-75">{tierInfo.name}</span>
      </div>
    )
  }

  const repaymentRate = reputation.total_loans > 0 
    ? (reputation.loans_repaid / reputation.total_loans) * 100 
    : 0

  return (
    <div className={`bg-white rounded-lg border p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reputation Score</h3>
        <div className={`px-3 py-1 rounded-full ${colors.bg} ${colors.text} text-sm font-medium`}>
          {tierInfo.icon} {tierInfo.name}
        </div>
      </div>

      {/* Credit Score */}
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-900 mb-1">
          {reputation.credit_score}
        </div>
        <div className="text-sm text-gray-600">
          Credit Score (out of 1000)
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              reputation.credit_score >= 800 ? 'bg-green-500' :
              reputation.credit_score >= 600 ? 'bg-yellow-500' :
              reputation.credit_score >= 400 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(reputation.credit_score / 10, 100)}%` }}
          />
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">
            {reputation.total_loans}
          </div>
          <div className="text-xs text-gray-600">Total Loans</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {repaymentRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600">Repayment Rate</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">
            {reputation.repayment_streak}
          </div>
          <div className="text-xs text-gray-600">Current Streak</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600">
            {reputation.trust_score}
          </div>
          <div className="text-xs text-gray-600">Trust Score</div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Borrowed:</span>
            <span className="font-medium ml-2">${reputation.total_borrowed?.toLocaleString() || '0'}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Lent:</span>
            <span className="font-medium ml-2">${reputation.total_lent?.toLocaleString() || '0'}</span>
          </div>
          {reputation.loans_defaulted > 0 && (
            <div className="col-span-2">
              <span className="text-red-600">Defaults:</span>
              <span className="font-medium ml-2">{reputation.loans_defaulted}</span>
            </div>
          )}
        </div>
      </div>

      {/* Average Repayment */}
      {reputation.avg_repayment_days !== null && (
        <div className="border-t pt-4">
          <div className="text-sm">
            <span className="text-gray-600">Average Repayment:</span>
            <span className={`font-medium ml-2 ${
              reputation.avg_repayment_days < 0 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {Math.abs(reputation.avg_repayment_days).toFixed(0)} days{' '}
              {reputation.avg_repayment_days < 0 ? 'early' : 'late'}
            </span>
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Achievement Badges</h4>
        <ReputationBadges badges={reputation.badges} />
      </div>

      {/* Tier Description */}
      <div className="border-t pt-4">
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <p className={`text-sm ${colors.text}`}>{tierInfo.description}</p>
        </div>
      </div>
    </div>
  )
}