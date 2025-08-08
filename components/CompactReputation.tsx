'use client'

import { useEffect, useState } from 'react'
import { UserReputation } from '@/lib/reputation'

interface CompactReputationProps {
  userFid: number
  className?: string
}

export function CompactReputation({ userFid, className = '' }: CompactReputationProps) {
  const [reputation, setReputation] = useState<UserReputation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const response = await fetch(`/api/reputation/${userFid}`)
        if (response.ok) {
          const data = await response.json()
          setReputation(data)
        }
      } catch (error) {
        console.error('Error fetching reputation:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReputation()
  }, [userFid])

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-full h-6 w-16 ${className}`}></div>
    )
  }

  if (!reputation) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        New user
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'bg-green-100 text-green-800'
    if (score >= 700) return 'bg-blue-100 text-blue-800'
    if (score >= 600) return 'bg-yellow-100 text-yellow-800'
    if (score >= 500) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getTierIcon = (score: number) => {
    if (score >= 800) return '👑'
    if (score >= 700) return '⭐'
    if (score >= 600) return '🛡️'
    if (score >= 500) return '✅'
    return '🌱'
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(reputation.score)}`}>
        <span className="mr-1">{getTierIcon(reputation.score)}</span>
        {reputation.score}
      </div>
      
      {reputation.repaymentStreak >= 5 && (
        <div className="text-xs text-orange-600" title={`${reputation.repaymentStreak} loan streak`}>
          🔥{reputation.repaymentStreak}
        </div>
      )}
      
      {reputation.badges && reputation.badges.length > 0 && (
        <div className="text-xs" title={`${reputation.badges.length} badges earned`}>
          🏆{reputation.badges.length}
        </div>
      )}
    </div>
  )
}