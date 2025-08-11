'use client'

import { useState, useEffect } from 'react'
import { Loan } from '@/lib/supabase'

interface Activity {
  id: string
  type: 'loan_created' | 'loan_funded' | 'loan_repaid'
  user: string
  amount: number
  timeAgo: string
  icon: string
  color: string
}

export function SocialProofFeed({ className = '' }: { className?: string }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/loans/list')
      if (!response.ok) return

      const loans: Loan[] = await response.json()
      
      // Generate activity feed from loans
      const recentActivities: Activity[] = []
      
      loans
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8)
        .forEach((loan) => {
          // Loan created activity
          recentActivities.push({
            id: `${loan.id}-created`,
            type: 'loan_created',
            user: `@user${loan.borrower_fid?.toString().slice(-3) || 'xxx'}`,
            amount: loan.gross_usdc || 0,
            timeAgo: formatTimeAgo(loan.created_at),
            icon: '📝',
            color: 'text-blue-600'
          })

          // Loan funded activity
          if (loan.status === 'funded' && loan.lender_fid) {
            recentActivities.push({
              id: `${loan.id}-funded`,
              type: 'loan_funded',
              user: `@user${loan.lender_fid.toString().slice(-3)}`,
              amount: loan.gross_usdc || 0,
              timeAgo: formatTimeAgo(loan.funded_ts || loan.created_at),
              icon: '💚',
              color: 'text-green-600'
            })
          }

          // TODO: Add real repaid loan activities when repayment tracking is implemented
        })

      // Only show real activities from actual loans
      setActivities(recentActivities.slice(0, 6))
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getActivityText = (activity: Activity): string => {
    switch (activity.type) {
      case 'loan_created':
        return `requested $${activity.amount.toLocaleString()} loan`
      case 'loan_funded':
        return `funded $${activity.amount.toLocaleString()} loan`
      case 'loan_repaid':
        return `repaid $${activity.amount.toLocaleString()} on time (+5 rep)`
      default:
        return 'activity'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
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
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Live Activity</h3>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 text-sm">
            <span className="text-lg">{activity.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900">
                <span className={`font-medium ${activity.color}`}>
                  {activity.user}
                </span>{' '}
                {getActivityText(activity)}
              </p>
              <p className="text-xs text-gray-500">{activity.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-center text-gray-500">
          💰 Early beta • Building trust through transparency
        </p>
      </div>
    </div>
  )
}