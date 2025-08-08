'use client'

import { useEffect, useState } from 'react'
import { UserReputation } from '@/lib/reputation'
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

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'bg-green-100 text-green-800'
    if (score >= 600) return 'bg-blue-100 text-blue-800'
    if (score >= 400) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getTierIcon = (score: number) => {
    if (score >= 800) return '👑'
    if (score >= 600) return '⭐'
    if (score >= 400) return '✅'
    return '🌱'
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getScoreColor(reputation.score)} text-sm font-medium ${className}`}>
        <span>{getTierIcon(reputation.score)}</span>
        <span>{reputation.score}</span>
      </div>
    )
  }

  const repaymentRate = reputation.totalLoans > 0 
    ? (reputation.repaidLoans / reputation.totalLoans) * 100 
    : 0

  return (
    <div className={`bg-white rounded-lg border p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reputation Score</h3>
        <div className={`px-3 py-1 rounded-full ${getScoreColor(reputation.score)} text-sm font-medium`}>
          {getTierIcon(reputation.score)} Score: {reputation.score}
        </div>
      </div>

      {/* Credit Score */}
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-900 mb-1">
          {reputation.score}
        </div>
        <div className="text-sm text-gray-600">
          Reputation Score (out of 1000)
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              reputation.score >= 800 ? 'bg-green-500' :
              reputation.score >= 600 ? 'bg-yellow-500' :
              reputation.score >= 400 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(reputation.score / 10, 100)}%` }}
          />
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">
            {reputation.totalLoans}
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
            {reputation.repaymentStreak}
          </div>
          <div className="text-xs text-gray-600">Current Streak</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600">
            ${reputation.maxLoanAmount}
          </div>
          <div className="text-xs text-gray-600">Max Loan</div>
        </div>
      </div>

      {/* Account Info */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Account Age:</span>
            <span className="font-medium ml-2">{reputation.accountAge} days</span>
          </div>
          <div>
            <span className="text-gray-600">Followers:</span>
            <span className="font-medium ml-2">{reputation.followerCount}</span>
          </div>
          {reputation.defaultedLoans > 0 && (
            <div className="col-span-2">
              <span className="text-red-600">Defaults:</span>
              <span className="font-medium ml-2">{reputation.defaultedLoans}</span>
            </div>
          )}
        </div>
      </div>

      {/* Last Score Change */}
      {reputation.lastScoreChange !== 0 && (
        <div className="border-t pt-4">
          <div className="text-sm">
            <span className="text-gray-600">Last Change:</span>
            <span className={`font-medium ml-2 ${
              reputation.lastScoreChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {reputation.lastScoreChange > 0 ? '+' : ''}{reputation.lastScoreChange} points
            </span>
            <div className="text-xs text-gray-500 mt-1">
              {reputation.lastScoreChangeReason}
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Achievement Badges</h4>
        <ReputationBadges badges={reputation.badges} />
      </div>
    </div>
  )
}