'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { Loan } from '@/lib/supabase'
import { format, isAfter } from 'date-fns'

export default function LendingDashboard() {
  const { user } = useAuth()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.fid) {
      fetchLenderLoans(user.fid)
    }
  }, [user])

  const fetchLenderLoans = async (lenderFid: number) => {
    try {
      setError(null)
      // Add timestamp to prevent caching issues
      const response = await fetch(`/api/loans?lender_fid=${lenderFid}&t=${Date.now()}`)
      console.log('API Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched loan data:', data) // Debug logging
        console.log('Setting loans state with:', data.length, 'loans')
        setLoans(data)
      } else {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        setError(`Failed to load loans: ${response.status}`)
        setLoans([])
      }
    } catch (err) {
      console.error('Error fetching lender loans:', err)
      setError(err instanceof Error ? err.message : 'Failed to load loans')
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please sign in to view your lending dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 py-12">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#6936F5] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading your lending portfolio...</span>
        </div>
      </div>
    )
  }

  const activeLoans = loans.filter(loan => loan.status === 'funded')
  const repaidLoans = loans.filter(loan => loan.status === 'repaid')
  
  // Debug logging
  useEffect(() => {
    console.log('Dashboard state:', {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      loanStatuses: loans.map(l => ({ id: l.id.slice(0,8), status: l.status })),
      userFid: user?.fid
    })
  }, [loans, user?.fid])
  const totalEarnings = repaidLoans.reduce((sum, loan) => {
    const principal = loan.gross_usdc || 0
    const repayment = loan.repay_usdc || 0
    return sum + (repayment - principal)
  }, 0)

  const totalLent = loans.reduce((sum, loan) => sum + (loan.gross_usdc || 0), 0)
  const upcomingRepayments = activeLoans.filter(loan => {
    const dueDate = new Date(loan.due_ts)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return isAfter(dueDate, new Date()) && isAfter(nextWeek, dueDate)
  })

  return (
    <div className="max-w-6xl mx-auto p-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lending Dashboard</h1>
        <p className="text-gray-600">Track your loans and earnings</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Lent</p>
              <p className="text-2xl font-bold text-gray-900">${totalLent.toFixed(0)}</p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
            </div>
            <div className="text-2xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Loans</p>
              <p className="text-2xl font-bold text-blue-600">{activeLoans.length}</p>
            </div>
            <div className="text-2xl">🔄</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Repayment Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {loans.length > 0 ? Math.round((repaidLoans.length / loans.length) * 100) : 0}%
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Upcoming Repayments */}
      {upcomingRepayments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming Repayments (Next 7 Days)</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-3">
              {upcomingRepayments.map(loan => (
                <div key={loan.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      LOANCAST-{loan.loan_number?.toString().padStart(4, '0') || loan.id.slice(0, 6)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${loan.repay_usdc?.toFixed(0)} due {format(new Date(loan.due_ts), 'MMM dd')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600 font-medium">
                      +${((loan.repay_usdc || 0) - (loan.gross_usdc || 0)).toFixed(2)} profit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Loans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Loans ({activeLoans.length})</h2>
        {activeLoans.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🏦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans</h3>
            <p className="text-gray-600 mb-4">Start lending to earn 2% monthly returns</p>
            <a
              href="/explore"
              className="inline-flex items-center gap-2 bg-[#6936F5] text-white px-4 py-2 rounded-lg hover:bg-[#5929cc] transition"
            >
              Browse Loan Requests
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeLoans.map(loan => (
              <div key={loan.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      LOANCAST-{loan.loan_number?.toString().padStart(4, '0') || loan.id.slice(0, 6)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Lent ${loan.gross_usdc?.toFixed(0)} • Due {format(new Date(loan.due_ts), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${loan.repay_usdc?.toFixed(0)} expected
                    </p>
                    <p className="text-sm text-gray-500">
                      +${((loan.repay_usdc || 0) - (loan.gross_usdc || 0)).toFixed(2)} profit
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Loans */}
      {repaidLoans.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Completed Loans ({repaidLoans.length})</h2>
          <div className="grid gap-4">
            {repaidLoans.map(loan => (
              <div key={loan.id} className="bg-green-50 rounded-lg border border-green-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      LOANCAST-{loan.loan_number?.toString().padStart(4, '0') || loan.id.slice(0, 6)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Repaid {format(new Date(loan.updated_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-700">
                      ✅ ${loan.repay_usdc?.toFixed(0)} received
                    </p>
                    <p className="text-sm text-green-600">
                      +${((loan.repay_usdc || 0) - (loan.gross_usdc || 0)).toFixed(2)} earned
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}