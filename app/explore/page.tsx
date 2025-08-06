'use client'

import { useEffect, useState } from 'react'
import { Loan } from '@/lib/supabase'
import { ExploreCard } from '@/components/ExploreCard'
import { StatsCard } from '@/components/StatsCard'

export default function Explore() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'funded'>('active')

  useEffect(() => {
    fetchLoans()
  }, [filter])

  const fetchLoans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/loans/list')
      const data = await response.json()
      
      let filteredData = data || []
      if (filter === 'active') {
        filteredData = (data || []).filter((loan: Loan) => loan.status === 'open')
      } else if (filter === 'funded') {
        filteredData = (data || []).filter((loan: Loan) => loan.status === 'funded')
      }
      
      setLoans(filteredData)
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
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

      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'active'
              ? 'bg-farcaster text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Active Loans
        </button>
        <button
          onClick={() => setFilter('funded')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'funded'
              ? 'bg-farcaster text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Funded
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'all'
              ? 'bg-farcaster text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farcaster"></div>
        </div>
      ) : loans.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map(loan => (
            <ExploreCard key={loan.id} loan={loan} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No loans found matching your filter.</p>
        </div>
      )}
    </div>
  )
}