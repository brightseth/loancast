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
    const apr = activity.loan.yield_bps / 100
    const handle = `@${activity.user?.replace('User ', '').toLowerCase()}`
    const amount = `$${(Number(BigInt(activity.loan.repay_expected_usdc || '0')) / 1e6).toFixed(0) || '0'}`
    
    switch (activity.type) {
      case 'new_loan':
        return `${handle} • ${amount} • ${apr}% APR`
      case 'funding':
        return `${handle} • $${activity.amount?.toFixed(0) || '0'} • funded`
      case 'repayment':
        return `${handle} • ${amount} • repaid`
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
          <p className="text-sm">No live loans. <a href="/loans/new" className="text-[#6936F5] hover:underline">Start one →</a></p>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {activities.map((activity) => {
            const isExpired = activity.loan.status === 'open' && new Date(activity.loan.due_ts) < new Date()
            
            return (
              <div key={activity.id} className="flex items-center space-x-3 py-2">
                {/* State dot */}
                <span className="text-sm">
                  {activity.loan.status === 'repaid' ? '🟢' : 
                   activity.loan.status === 'open' && !isExpired ? '🕑' : '🔴'}
                </span>
                
                {/* Clean activity text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {getActivityText(activity)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}