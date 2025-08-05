'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers'
import { Loan } from '@/lib/supabase'
import { format } from 'date-fns'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function AdminPage() {
  const { user } = useAuth()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Simple admin check - you can make this more sophisticated
  const isAdmin = user?.fid === 12345 // Your test FID

  useEffect(() => {
    if (isAdmin) {
      fetchAllLoans()
    }
  }, [isAdmin])

  const fetchAllLoans = async () => {
    try {
      const response = await fetch('/api/admin/loans')
      if (response.ok) {
        const data = await response.json()
        setLoans(data)
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteLoan = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan? This cannot be undone.')) {
      return
    }

    setDeleting(loanId)
    try {
      const response = await fetch(`/api/admin/loans/${loanId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLoans(loans.filter(loan => loan.id !== loanId))
      } else {
        alert('Failed to delete loan')
      }
    } catch (error) {
      console.error('Error deleting loan:', error)
      alert('Error deleting loan')
    } finally {
      setDeleting(null)
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-0 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please sign in to access admin panel</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-0 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Access denied - Admin only</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage loans and test data</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Mode</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">All Loans ({loans.length})</h2>
          </div>
          
          {loans.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No loans found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Borrower
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            ${loan.repay_usdc?.toFixed(0)} USDC
                          </div>
                          <div className="text-sm text-gray-500">
                            {loan.yield_bps / 100}% APR • Due {format(new Date(loan.due_ts), 'M/d/yyyy')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">FID: {loan.borrower_fid}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          loan.status === 'open' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : loan.status === 'repaid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(loan.created_at), 'M/d/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => deleteLoan(loan.id)}
                          disabled={deleting === loan.id}
                          className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === loan.id ? (
                            <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Admin Panel</p>
            <p>Use this interface to clean up test loans. Deleted loans cannot be recovered.</p>
          </div>
        </div>
      </div>
    </div>
  )
}