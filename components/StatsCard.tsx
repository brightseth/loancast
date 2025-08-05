'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, DollarSign, Award } from 'lucide-react'

export function StatsCard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!stats || !stats.overview) return null

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Platform Statistics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Total Volume</span>
          </div>
          <p className="text-2xl font-bold">${stats.overview?.totalVolume || '0.00'}</p>
          <p className="text-xs text-gray-500">USDC</p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Repayment Rate</span>
          </div>
          <p className="text-2xl font-bold">{stats.overview?.repaymentRate || '0'}%</p>
          <p className="text-xs text-gray-500">On-time</p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Active Loans</span>
          </div>
          <p className="text-2xl font-bold">{stats.overview?.activeLoans || '0'}</p>
          <p className="text-xs text-gray-500">Open now</p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs">Avg Credit</span>
          </div>
          <p className="text-2xl font-bold">{stats.users?.avgCreditScore || '0'}</p>
          <p className="text-xs text-gray-500">Score</p>
        </div>
      </div>


      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Last 24h</span>
          <div className="flex gap-4">
            <span className="text-green-600 font-medium">
              +{stats.recentActivity?.last24h?.newLoans || 0} new
            </span>
            <span className="text-blue-600 font-medium">
              {stats.recentActivity?.last24h?.repayments || 0} repaid
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}