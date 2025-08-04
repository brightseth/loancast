'use client'

import { Loan } from '@/lib/supabase'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import Link from 'next/link'

interface LoanCardProps {
  loan: Loan
  userRole: 'borrower' | 'lender'
}

export function LoanCard({ loan, userRole }: LoanCardProps) {
  const dueDate = new Date(loan.due_ts)
  const isOverdue = isPast(dueDate) && loan.status === 'open'
  
  const getStatusColor = () => {
    switch (loan.status) {
      case 'open':
        return isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
      case 'repaid':
        return 'bg-green-100 text-green-800'
      case 'default':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = () => {
    if (loan.status === 'open' && isOverdue) {
      return 'Overdue'
    }
    return loan.status.charAt(0).toUpperCase() + loan.status.slice(1)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            ${loan.repay_usdc?.toFixed(2) || '0.00'} USDC
          </h3>
          <p className="text-sm text-gray-600">
            {loan.yield_bps / 100}% APR
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Due Date:</span>
          <span className="font-medium">
            {format(dueDate, 'MMM dd, yyyy')}
            {loan.status === 'open' && (
              <span className="text-gray-500 ml-1">
                ({formatDistanceToNow(dueDate, { addSuffix: true })})
              </span>
            )}
          </span>
        </div>

        {loan.gross_usdc && (
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Funded:</span>
            <span className="font-medium">${loan.gross_usdc.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Farcaster Cast:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">#{loan.cast_hash.slice(2, 8)}</span>
            <a
              href={`https://warpcast.com/~/conversations/${loan.cast_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-farcaster hover:underline text-sm font-medium"
            >
              View Cast →
            </a>
          </div>
        </div>
      </div>

      {loan.status === 'open' && userRole === 'borrower' && (
        <Link
          href={`/loans/${loan.id}/repay`}
          className="mt-4 block w-full text-center bg-farcaster text-white py-2 rounded-md font-medium hover:bg-farcaster-dark transition"
        >
          Mark as Repaid
        </Link>
      )}
    </div>
  )
}