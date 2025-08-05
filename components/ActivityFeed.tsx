'use client'

import { useEffect, useState } from 'react'
import { Loan } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'new_loan' | 'funding' | 'repayment'
  loan: Loan
  timestamp: string
  amount?: number
  user?: string
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
    // Poll for new activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/loans?limit=5&sort=recent')
      const loans = await response.json()
      
      if (Array.isArray(loans)) {
        // Create activity items from recent loans
        const activityItems: ActivityItem[] = loans.map(loan => ({
          id: `${loan.id}_created`,
          type: 'new_loan' as const,
          loan,
          timestamp: loan.created_at,
          user: `User ${loan.borrower_fid}`
        }))
        
        setActivities(activityItems)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_loan': return '📝'
      case 'funding': return '💰'
      case 'repayment': return '✅'
      default: return '📱'
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    const loanNumber = `#${activity.loan.id.slice(0, 6).toUpperCase()}`
    const apr = activity.loan.yield_bps / 100
    switch (activity.type) {
      case 'new_loan':
        return (
          <span>
            <span className="font-medium">@{activity.user?.replace('User ', '').toLowerCase()}</span>
            <span className="mx-1">—</span>
            <span className="font-medium text-[#6936F5]">${activity.loan.repay_usdc?.toFixed(0) || '0'}</span>
            <span className="text-xs text-gray-500 ml-1">· {apr}% APR</span>
          </span>
        )
      case 'funding':
        return (
          <span>
            <span className="font-medium">{activity.user}</span> funded{' '}
            <span className="font-medium text-green-600">${activity.amount?.toFixed(0) || '0'}</span>
          </span>
        )
      case 'repayment':
        return (
          <span>
            <span className="font-medium">{activity.user}</span> repaid{' '}
            <span className="font-medium text-green-600">${activity.loan.repay_usdc?.toFixed(0) || '0'}</span>
          </span>
        )
      default:
        return 'Unknown activity'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Live Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Live Activity</h3>
        <div className="flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
          Live
        </div>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">💤</div>
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[240px] overflow-y-auto">
          {activities.map((activity) => {
            const isExpired = activity.loan.status === 'open' && new Date(activity.loan.due_ts) < new Date()
            const hoursLeft = Math.max(0, Math.floor((new Date(activity.loan.due_ts).getTime() - Date.now()) / (1000 * 60 * 60)))
            
            return (
              <div key={activity.id} className="flex items-start space-x-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition">
                <div className="flex items-center space-x-2">
                  <span className="text-xs">
                    {activity.loan.status === 'repaid' ? '🟢' : 
                     activity.loan.status === 'open' && !isExpired ? '🕑' : '🔴'}
                  </span>
                  <div className="text-xl">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {getActivityText(activity)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <a
                    href={`https://warpcast.com/~/conversations/${activity.loan.cast_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#6936F5] hover:underline"
                  >
                    View Cast
                  </a>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}