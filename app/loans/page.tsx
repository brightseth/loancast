'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { Loan } from '@/lib/supabase'
import { LoanCard } from '@/components/LoanCard'
import Link from 'next/link'

export default function MyLoans() {
  const { user } = useAuth()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'borrower' | 'lender'>('borrower')

  useEffect(() => {
    if (user) {
      fetchLoans()
    }
  }, [user, activeTab])

  const fetchLoans = async () => {
    setLoading(true)
    try {
      const params = activeTab === 'borrower' 
        ? `borrower_fid=${user!.fid}`
        : `lender_fid=${user!.fid}`
      
      const response = await fetch(`/api/loans?${params}`)
      const data = await response.json()
      setLoans(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching loans:', error)
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

  const activeLoans = loans?.filter(loan => loan.status === 'open') || []
  const completedLoans = loans?.filter(loan => loan.status !== 'open') || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Loans</h1>
        <Link
          href="/loans/new"
          className="bg-farcaster text-white px-4 py-2 rounded-lg font-medium hover:bg-farcaster-dark transition"
        >
          New Loan Request
        </Link>
      </div>

      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('borrower')}
          className={`px-4 py-2 rounded-t-lg font-medium ${
            activeTab === 'borrower'
              ? 'bg-white border-b-2 border-farcaster text-farcaster'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          As Borrower
        </button>
        <button
          onClick={() => setActiveTab('lender')}
          className={`px-4 py-2 rounded-t-lg font-medium ${
            activeTab === 'lender'
              ? 'bg-white border-b-2 border-farcaster text-farcaster'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          As Lender
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farcaster"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {activeLoans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Loans</h2>
              <div className="grid gap-4">
                {activeLoans.map(loan => (
                  <LoanCard key={loan.id} loan={loan} userRole={activeTab} />
                ))}
              </div>
            </div>
          )}

          {completedLoans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">History</h2>
              <div className="grid gap-4">
                {completedLoans.map(loan => (
                  <LoanCard key={loan.id} loan={loan} userRole={activeTab} />
                ))}
              </div>
            </div>
          )}

          {loans.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {activeTab === 'borrower' 
                  ? "You haven't created any loan requests yet."
                  : "You haven't funded any loans yet."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}