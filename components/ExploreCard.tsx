'use client'

import { Loan } from '@/lib/supabase'
import { format, formatDistanceToNow } from 'date-fns'

interface ExploreCardProps {
  loan: Loan
}

export function ExploreCard({ loan }: ExploreCardProps) {
  const dueDate = new Date(loan.due_ts)
  const createdDate = new Date(loan.created_at || loan.start_ts)
  const apr = loan.yield_bps / 100
  const isFunded = loan.status === 'funded'
  const castHashDisplay = `#${loan.cast_hash.slice(0, 8)}`
  
  // Check if loan is new (created within last 24 hours)
  const isNew = Date.now() - createdDate.getTime() < 24 * 60 * 60 * 1000

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-4 sm:p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-mono text-gray-500 truncate">{castHashDisplay}</p>
            {isNew && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                NEW
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            ${loan.repay_usdc?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">Total repayment</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isFunded 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isFunded ? 'Funded' : 'Open'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">APR</span>
          <span className="text-lg font-semibold text-farcaster">
            {apr.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Duration</span>
          <span className="text-sm font-medium">
            {formatDistanceToNow(dueDate, { addSuffix: false })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Due Date</span>
          <span className="text-sm font-medium">
            {format(dueDate, 'MMM dd, yyyy')}
          </span>
        </div>

        {loan.gross_usdc && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount Funded</span>
              <span className="text-sm font-medium">
                ${loan.gross_usdc.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">Platform Fee</span>
              <span className="text-sm font-medium">
                ${((loan.gross_usdc - (loan.net_usdc || 0))).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">📱 Farcaster Cast #{loan.cast_hash.slice(2, 8)}</p>
          <div className="bg-gray-50 rounded-md p-2 text-xs text-gray-700 border">
            🏦 ${(loan.repay_usdc && loan.yield_bps ? 
              ((loan.repay_usdc * 10000) / (10000 + loan.yield_bps)).toFixed(0) : '0')} USDC loan
            • 2% monthly • Due {format(dueDate, 'M/d')}
          </div>
        </div>
        <div className="flex gap-2 mt-auto">
          <a
            href={`https://warpcast.com/~/conversations/${loan.cast_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-farcaster text-white py-2 px-3 sm:px-4 rounded-md font-medium hover:bg-farcaster-dark transition text-center block text-sm"
          >
            {isFunded ? 'View Cast' : 'Bid on Cast'}
          </a>
          <a
            href={`/profile/${loan.borrower_fid}`}
            className="px-2 sm:px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-center"
            title="View borrower profile"
          >
            <span className="text-sm">👤</span>
          </a>
        </div>
      </div>
    </div>
  )
}