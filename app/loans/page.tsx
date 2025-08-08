'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { Loan } from '@/lib/supabase'
import LoanCard from '@/components/LoanCard'
import Link from 'next/link'

export default function MyLoans() {
  const { user } = useAuth()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'borrower'>('borrower')

  useEffect(() => {
    if (user) {
      fetchLoans()
    }
  }, [user])

  const fetchLoans = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = `borrower_fid=${user!.fid}`
      
      const response = await fetch(`/api/loans?${params}`)
      
      if (!response.ok) {
        console.error('Loans API error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
        setError(`Failed to load loans: ${response.status} ${response.statusText}`)
        setLoans([])
        return
      }
      
      const data = await response.json()
      console.log('Loans data received:', data)
      setLoans(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching loans:', error)
      setError('Network error while loading loans')
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please sign in to view your loans.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farcaster mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your loans...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium mb-2">Error loading loans</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchLoans}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const activeLoans = loans?.filter(loan => loan.status === 'open') || []
  const completedLoans = loans?.filter(loan => loan.status !== 'open') || []
  

  return (
    <div className="max-w-screen-md mx-auto p-4 py-12">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Loan Requests</h1>
          {user && (
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <img 
                src={user.pfpUrl || 'https://via.placeholder.com/32'} 
                alt={user.displayName}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <span className="font-medium">{user.displayName}</span>
                <div className="flex items-center space-x-2">
                  <span>📊 Reputation: 85%</span>
                  <span>•</span>
                  <span>FID: {user.fid}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <Link
          href="/loans/new"
          className="bg-[#6936F5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#5929cc] transition"
        >
          Request Loan
        </Link>
      </div>


      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {activeLoans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Loans</h2>
              <div className="grid gap-4">
                {activeLoans.map(loan => (
                  <LoanCard key={loan.id} loan={loan} userRole="borrower" />
                ))}
              </div>
            </div>
          )}

          {completedLoans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">History</h2>
              <div className="grid gap-4">
                {completedLoans.map(loan => (
                  <LoanCard key={loan.id} loan={loan} userRole="borrower" />
                ))}
              </div>
            </div>
          )}

          {loans.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <div className="text-6xl mb-4">
                  {activeTab === 'borrower' ? '💰' : activeTab === 'lender' ? '🏦' : '👀'}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'borrower' ? 'No loans yet' : 
                   activeTab === 'lender' ? "Looks like you haven't lent before" :
                   "No loans being watched"}  
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'borrower' 
                    ? "Ready to create your first LoanCast?"
                    : activeTab === 'lender'
                    ? "Browse active loans and start lending."
                    : "Browse loans and click Fund buttons to add them to your watchlist."}
                </p>
                <Link
                  href={activeTab === 'borrower' ? '/loans/new' : '/explore'}
                  className="inline-block bg-[#6936F5] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5929cc] transition"
                >
                  {activeTab === 'borrower' ? 'Create one' : 'Browse /explore'}
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}