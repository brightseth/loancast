'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loan } from '@/lib/supabase'
import { ExploreCard } from '@/components/ExploreCard'
import { StatsCard } from '@/components/StatsCard'
import { useAnalytics } from '@/lib/analytics'

export default function Explore() {
  const analytics = useAnalytics()
  const searchParams = useSearchParams()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'funded'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [duration, setDuration] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    fetchLoans()
  }, [filter])

  useEffect(() => {
    analytics.featureUsed('Explore Page Viewed')
    
    // Check if user came from 404 redirect
    const from404 = searchParams?.get('from') === '404'
    if (from404) {
      setShowToast(true)
      // Auto-hide toast after 5 seconds
      setTimeout(() => setShowToast(false), 5000)
    }
  }, [searchParams])

  const filteredLoans = loans.filter(loan => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const loanNumber = `#${loan.id.slice(0, 6).toUpperCase()}`
      if (!loanNumber.toLowerCase().includes(searchLower) && 
          !(loan.repay_usdc || 0).toString().includes(searchTerm)) {
        return false
      }
    }

    // Amount filters
    if (minAmount && loan.repay_usdc && loan.repay_usdc < parseFloat(minAmount)) {
      return false
    }
    if (maxAmount && loan.repay_usdc && loan.repay_usdc > parseFloat(maxAmount)) {
      return false
    }

    // Duration filter - calculate from dates
    if (duration) {
      const createdDate = new Date(loan.created_at)
      const dueDate = new Date(loan.due_ts)
      const diffMonths = Math.round((dueDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      if (diffMonths.toString() !== duration) {
        return false
      }
    }

    return true
  })

  // Track search when filters change
  const activeFilters = useMemo(() => {
    const filters: Record<string, any> = {}
    if (searchTerm) filters.searchTerm = searchTerm
    if (minAmount) filters.minAmount = minAmount
    if (maxAmount) filters.maxAmount = maxAmount
    if (duration) filters.duration = duration
    if (filter !== 'active') filters.status = filter
    return filters
  }, [searchTerm, minAmount, maxAmount, duration, filter])

  useEffect(() => {
    if (Object.keys(activeFilters).length > 0) {
      analytics.searchPerformed(searchTerm, activeFilters, filteredLoans.length)
    }
  }, [activeFilters, filteredLoans.length])

  const fetchLoans = async () => {
    setLoading(true)
    try {
      console.log('Fetching loans with filter:', filter)
      const response = await fetch('/api/loans')
      
      if (!response.ok) {
        console.error('Loans list API error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
        setLoans([])
        return
      }
      
      const data = await response.json()
      console.log('Received loans data:', data?.length, 'loans')
      
      let filteredData = data || []
      if (filter === 'active') {
        filteredData = (data || []).filter((loan: Loan) => loan.status === 'open')
      } else if (filter === 'funded') {
        filteredData = (data || []).filter((loan: Loan) => loan.status === 'funded')
      }
      
      console.log('Filtered loans:', filteredData.length)
      setLoans(filteredData)
    } catch (error) {
      console.error('Error fetching loans:', error)
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Toast notification for 404 redirects */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <p className="text-sm">That loan was deleted—browse others here!</p>
            <button 
              onClick={() => setShowToast(false)}
              className="ml-auto text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Explore Loans</h1>
        <p className="text-gray-600 mb-6">
          Discover and fund social loans on Farcaster. Earn yield while helping the community.
        </p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Risk Disclaimer:</strong> Loans are based on trust and social reputation. 
            Only lend what you can afford to lose. There is no escrow or guaranteed repayment.
          </p>
        </div>

        <StatsCard />
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by loan number or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farcaster focus:border-transparent"
          />
          <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-farcaster hover:text-purple-700 flex items-center gap-1"
        >
          Advanced Filters
          <svg className={`h-4 w-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                placeholder="$0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-farcaster focus:border-farcaster"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                placeholder="$5000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-farcaster focus:border-farcaster"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-farcaster focus:border-farcaster"
              >
                <option value="">All durations</option>
                <option value="1">1 month</option>
                <option value="2">2 months</option>
                <option value="3">3 months</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-2 sm:px-4 rounded-lg font-medium text-sm ${
            filter === 'active'
              ? 'bg-farcaster text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('funded')}
          className={`px-3 py-2 sm:px-4 rounded-lg font-medium text-sm ${
            filter === 'funded'
              ? 'bg-farcaster text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Funded
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 sm:px-4 rounded-lg font-medium text-sm ${
            filter === 'all'
              ? 'bg-farcaster text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
      </div>

      {/* Results Counter */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredLoans.length} of {loans.length} loans
          {(searchTerm || minAmount || maxAmount || duration) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setMinAmount('')
                setMaxAmount('')
                setDuration('')
                setShowAdvanced(false)
              }}
              className="ml-2 text-farcaster hover:text-purple-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Loading skeletons */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 sm:p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredLoans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredLoans.map(loan => (
            <ExploreCard key={loan.id} loan={loan} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {searchTerm || minAmount || maxAmount || duration 
              ? 'No loans found matching your search criteria.' 
              : 'No loans found matching your filter.'}
          </p>
          {(searchTerm || minAmount || maxAmount || duration) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setMinAmount('')
                setMaxAmount('')
                setDuration('')
                setShowAdvanced(false)
              }}
              className="mt-2 text-farcaster hover:text-purple-700 underline"
            >
              Clear search filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}