'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loan } from '@/lib/supabase'
import { format, formatDistanceToNow, isPast, addDays } from 'date-fns'
import Link from 'next/link'
import { CountdownTimer } from '@/components/CountdownTimer'

export default function LoanDetail() {
  const { id } = useParams()
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchLoan()
    }
  }, [id])

  const fetchLoan = async () => {
    try {
      const response = await fetch(`/api/loans/${id}`)
      if (response.ok) {
        const data = await response.json()
        setLoan(data)
      }
    } catch (error) {
      console.error('Error fetching loan:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loan Not Found</h1>
          <p className="text-gray-600 mb-8">The loan you're looking for doesn't exist.</p>
          <Link
            href="/loans"
            className="bg-[#6936F5] text-white px-4 py-2 rounded-lg hover:bg-[#5929cc] transition"
          >
            Back to My Loans
          </Link>
        </div>
      </div>
    )
  }

  const dueDate = new Date(loan.due_ts)
  const isOverdue = isPast(dueDate) && loan.status === 'open'
  const apr = loan.yield_bps / 100

  return (
    <div className="max-w-screen-md mx-auto p-4 py-12">
      <div className="mb-6">
        <Link href="/loans" className="text-[#6936F5] hover:underline">
          ← Back to My Loans
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ${loan.repay_usdc?.toFixed(2) || '0.00'} USDC Loan
            </h1>
            <p className="text-gray-600 mt-1">
              {apr.toFixed(2)}% APR • Due {format(dueDate, 'MMM dd, yyyy')}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            loan.status === 'open' 
              ? isOverdue 
                ? '🔴 bg-red-100 text-red-800' 
                : '🟡 bg-yellow-100 text-yellow-800'
              : loan.status === 'repaid'
                ? '🟢 bg-green-100 text-green-800'
                : '🔴 bg-red-100 text-red-800'
          }`}>
            {loan.status === 'open' && isOverdue ? '🔴 Overdue' : loan.status === 'open' ? '🟡 Open' : loan.status === 'repaid' ? '🟢 Repaid' : '🔴 Default'}
          </span>
        </div>

        {loan.status === 'open' && !isOverdue && (
          <div className="mb-8 p-6 bg-gradient-to-r from-[#6936F5]/10 to-purple-100 rounded-lg">
            <CountdownTimer 
              endTime={addDays(new Date(loan.created_at), 1)} 
              className="mb-4"
            />
            <p className="text-center text-sm text-gray-600">
              🗓️ Auction ends 24 hours after posting
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">Loan Amount:</dt>
                <dd className="font-medium">${loan.repay_usdc && loan.yield_bps ? 
                  ((loan.repay_usdc * 10000) / (10000 + loan.yield_bps)).toFixed(2) : '0.00'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Interest:</dt>
                <dd className="font-medium">${loan.repay_usdc && loan.yield_bps ? 
                  (loan.repay_usdc - (loan.repay_usdc * 10000) / (10000 + loan.yield_bps)).toFixed(2) : '0.00'}</dd>
              </div>
              <div className="flex justify-between border-t pt-3">
                <dt className="text-gray-600 font-semibold">Total Repayment:</dt>
                <dd className="font-bold text-lg">${loan.repay_usdc?.toFixed(2) || '0.00'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">APR:</dt>
                <dd className="font-medium">{apr.toFixed(2)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Due Date:</dt>
                <dd className="font-medium">
                  {format(dueDate, 'MMM dd, yyyy')}
                  <span className="text-gray-500 ml-2">
                    ({formatDistanceToNow(dueDate, { addSuffix: true })})
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Loan Created</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(loan.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              {loan.lender_fid && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Loan Funded</p>
                    <p className="text-sm text-gray-600">Lender FID: {loan.lender_fid}</p>
                  </div>
                </div>
              )}

              {loan.status === 'repaid' && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Loan Repaid</p>
                    {loan.tx_repay && (
                      <a
                        href={`https://basescan.org/tx/${loan.tx_repay}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#6936F5] hover:underline"
                      >
                        View Transaction
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <h2 className="text-lg font-semibold mb-4">Cast Details</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Original Farcaster Cast:</p>
            <a
              href={`https://warpcast.com/~/conversations/${loan.cast_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-farcaster hover:underline"
            >
              View on Warpcast →
            </a>
          </div>
        </div>

        {loan.status === 'open' && (
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <Link
              href={`/loans/${loan.id}/repay`}
              className="bg-[#6936F5] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5929cc] transition"
            >
              Mark as Repaid
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}