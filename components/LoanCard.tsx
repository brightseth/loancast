'use client'

import { Loan } from '@/lib/supabase'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import Link from 'next/link'
import { CountdownChip } from './CountdownChip'
import { DropdownMenu } from './DropdownMenu'
import { ProfileBadge } from './ProfileBadge'
import { CompactReputation } from './CompactReputation'

interface LoanCardProps {
  loan: Loan
  userRole: 'borrower' | 'lender'
}

export function LoanCard({ loan, userRole }: LoanCardProps) {
  const dueDate = new Date(loan.due_ts)
  const isOverdue = isPast(dueDate) && loan.status === 'open'
  
  // Use loan_number if available, otherwise fallback to ID slice
  const loanNumber = loan.loan_number 
    ? `LOANCAST-${loan.loan_number.toString().padStart(4, '0')}`
    : `#${loan.id.slice(0, 6).toUpperCase()}`
  
  const getStatusColors = () => {
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const isDueSoon = dueDate <= threeDaysFromNow && loan.status === 'open'
    
    switch (loan.status) {
      case 'open':
        if (isOverdue) return { ribbon: 'border-l-4 border-red-500', pill: 'bg-red-100 text-red-800' }
        if (isDueSoon) return { ribbon: 'border-l-4 border-yellow-500', pill: 'bg-yellow-100 text-yellow-800' }
        return { ribbon: 'border-l-4 border-green-500', pill: 'bg-green-100 text-green-800' }
      case 'funded':
        return { ribbon: 'border-l-4 border-blue-500', pill: 'bg-blue-100 text-blue-800' }
      case 'repaid':
        return { ribbon: 'border-l-4 border-green-500', pill: 'bg-green-100 text-green-800' }
      case 'default':
        return { ribbon: 'border-l-4 border-red-500', pill: 'bg-red-100 text-red-800' }
      default:
        return { ribbon: '', pill: 'bg-gray-100 text-gray-800' }
    }
  }

  const getStatusText = () => {
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const isDueSoon = dueDate <= threeDaysFromNow && loan.status === 'open'
    
    if (loan.status === 'open' && isOverdue) return 'Default'
    if (loan.status === 'open' && isDueSoon) return `Due <3d`
    if (loan.status === 'open') return 'Open'
    return loan.status.charAt(0).toUpperCase() + loan.status.slice(1)
  }

  const colors = getStatusColors()
  
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition ${colors.ribbon}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500">{loanNumber}</span>
          </div>
          <h3 className="text-lg font-semibold">
            ${loan.repay_usdc?.toFixed(0) || '0'} USDC
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {loan.yield_bps / 100}% APR
            </p>
          </div>
          <div className="mt-2">
            <ProfileBadge fid={loan.borrower_fid} showStats={false} />
            <div className="mt-1">
              <CompactReputation userFid={loan.borrower_fid} />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.pill}`}>
            {getStatusText()}
          </span>
          {(loan.status === 'open' || loan.status === 'funded') && userRole === 'borrower' && (
            <DropdownMenu
              items={[
                ...(loan.status === 'funded' ? [{
                  label: 'Repay This Loan',
                  onClick: () => window.location.href = `/loans/${loan.id}`,
                  className: 'text-[#6936F5] font-medium'
                }] : []),
                {
                  label: 'View Details',
                  onClick: () => window.location.href = `/loans/${loan.id}`,
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* Repayment CTA for funded loans */}
      {loan.status === 'funded' && userRole === 'borrower' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800 mb-2">
            💰 Loan funded! Ready to repay ${loan.repay_usdc?.toFixed(2)}
          </p>
          <button
            onClick={() => window.location.href = `/loans/${loan.id}`}
            className="bg-[#6936F5] text-white px-6 py-3 rounded-lg hover:bg-[#5929cc] transition font-bold text-sm tracking-wide"
          >
            REPAY THIS LOAN
          </button>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-700">Due Date:</span>
          <div className="text-right">
            <div className="font-medium">
              {format(dueDate, 'MMM dd, yyyy')}
            </div>
            {loan.status === 'open' && (
              <CountdownChip dueDate={dueDate} className="mt-1" />
            )}
          </div>
        </div>

        {loan.gross_usdc && (
          <div className="flex justify-between">
            <span className="text-gray-700">Amount Funded:</span>
            <span className="font-medium">${loan.gross_usdc.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-700">Farcaster Cast:</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">#{loan.cast_hash.slice(2, 8)}</span>
            <button
              onClick={async () => {
                const url = `https://loancast.app/loans/${loan.id}`
                try {
                  await navigator.clipboard.writeText(url)
                  // Could add toast notification here
                } catch (err) {
                  console.error('Failed to copy:', err)
                }
              }}
              className="text-gray-500 hover:text-[#6936F5] text-xs font-medium"
            >
              Copy Link
            </button>
            <a
              href={`https://warpcast.com/~/conversations/${loan.cast_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6936F5] hover:underline text-sm font-medium"
            >
              View Cast →
            </a>
          </div>
        </div>

        {/* Profile Links */}
        <div className="flex justify-between items-center pt-3 border-t">
          <a
            href={`/profile/${loan.borrower_fid}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-farcaster transition"
          >
            👤 Borrower Profile
          </a>
          {loan.lender_fid && (
            <a
              href={`/profile/${loan.lender_fid}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-farcaster transition"
            >
              💰 Lender Profile
            </a>
          )}
        </div>
      </div>

    </div>
  )
}