'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loan } from '@/lib/supabase'
import { format, formatDistanceToNow, isPast, addDays } from 'date-fns'
import Link from 'next/link'
import { CountdownTimer } from '@/components/CountdownTimer'
import { ProfileBadge } from '@/components/ProfileBadge'
import { RepaymentModal } from '@/components/RepaymentModal'
import { WalletRepaymentModal } from '@/components/WalletRepaymentModal'

interface Bid {
  id: string
  lender_fid: number
  amount: number
  cast_hash: string
  created_at: string
  status: string
}

interface ExtendedLoan extends Loan {
  likes_count?: number
  recasts_count?: number
  replies_count?: number
  bids?: Bid[]
}

export default function LoanDetail() {
  const { id } = useParams()
  const [loan, setLoan] = useState<ExtendedLoan | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showRepaymentModal, setShowRepaymentModal] = useState(false)
  const [showWalletRepayment, setShowWalletRepayment] = useState(false)
  const [lenderWallet, setLenderWallet] = useState<string | null>(null)

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
        
        // Fetch lender wallet if loan is funded
        if (data.status === 'funded' && data.lender_fid) {
          fetchLenderWallet()
        }
      }
    } catch (error) {
      console.error('Error fetching loan:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLenderWallet = async () => {
    try {
      // Use the new NFT-based repayment system
      const response = await fetch(`/api/repay/${id}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowerAddr: '0x0000000000000000000000000000000000000000' // Placeholder
        })
      })
      if (response.ok) {
        const data = await response.json()
        setLenderWallet(data.target?.to || null)
      }
    } catch (error) {
      console.error('Error fetching lender wallet:', error)
    }
  }

  const syncLoanData = async () => {
    if (!loan) return
    
    setSyncing(true)
    try {
      const response = await fetch(`/api/webhooks/neynar?loan_id=${loan.id}`)
      if (response.ok) {
        // Refresh loan data
        await fetchLoan()
      }
    } catch (error) {
      console.error('Error syncing loan:', error)
    } finally {
      setSyncing(false)
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
  const apr = (loan.yield_bps || 0) / 100
  const auctionEndTime = addDays(new Date(loan.created_at), 1)
  const isAuctionActive = !isPast(auctionEndTime) && loan.status === 'open'

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
              ${(loan.repay_usdc || 0).toFixed(2)} USDC Loan
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
              : loan.status === 'funded'
                ? '💰 bg-blue-100 text-blue-800'
              : loan.status === 'repaid'
                ? '🟢 bg-green-100 text-green-800'
                : '🔴 bg-red-100 text-red-800'
          }`}>
            {loan.status === 'open' && isOverdue ? '🔴 Overdue' : 
             loan.status === 'open' ? '🟡 Open' : 
             loan.status === 'funded' ? '💰 Funded' :
             loan.status === 'repaid' ? '🟢 Repaid' : '🔴 Default'}
          </span>
        </div>

        {isAuctionActive && (
          <div className="mb-8 p-6 bg-gradient-to-r from-[#6936F5]/10 to-purple-100 rounded-lg">
            <CountdownTimer 
              endTime={auctionEndTime} 
              className="mb-4"
            />
            <p className="text-center text-sm text-gray-600">
              🗓️ Auction ends 24 hours after posting
            </p>
          </div>
        )}

        {/* Engagement Metrics */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Cast Engagement</h3>
            <button
              onClick={syncLoanData}
              disabled={syncing}
              className="text-xs text-[#6936F5] hover:underline disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Refresh'}
            </button>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {loan.likes_count || 0} likes
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loan.recasts_count || 0} recasts
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {loan.replies_count || 0} replies
            </span>
          </div>
        </div>

        {/* Bids Section */}
        {loan.bids && loan.bids.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Bids</h2>
            <div className="space-y-2">
              {loan.bids
                .sort((a, b) => b.amount - a.amount)
                .map((bid) => (
                  <div
                    key={bid.id}
                    className={`p-4 rounded-lg border ${
                      bid.status === 'accepted'
                        ? 'bg-green-50 border-green-200'
                        : bid.status === 'active'
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ProfileBadge fid={bid.lender_fid} />
                        <div>
                          <p className="font-semibold">${bid.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-600">
                            {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {bid.status === 'accepted' && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Winning Bid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
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
                <dd className="font-bold text-lg">${(loan.repay_usdc || 0).toFixed(2)}</dd>
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
              
              {loan.status === 'funded' && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Loan Funded</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(loan.updated_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                    {loan.lender_fid && (
                      <p className="text-sm text-gray-600">Lender FID: {loan.lender_fid}</p>
                    )}
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
              className="inline-flex items-center text-[#6936F5] hover:underline"
            >
              View on Warpcast →
            </a>
            <div className="mt-2">
              <code className="text-xs text-gray-600 break-all">{loan.cast_hash}</code>
            </div>
          </div>
        </div>


        {loan.status === 'funded' && (
          <div className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">✅ Loan Funded - Ready for Repayment</h3>
            <p className="text-sm text-green-800 mb-4">
              This loan has been funded and is ready for repayment. Send ${(loan.repay_usdc || 0).toFixed(2)} USDC to the lender.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWalletRepayment(true)}
                className="bg-[#6936F5] text-white px-6 py-3 rounded-lg hover:bg-[#5929cc] transition font-bold text-lg tracking-wide flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                PAY WITH WALLET
              </button>
              <button
                onClick={() => setShowRepaymentModal(true)}
                className="px-6 py-3 border-2 border-[#6936F5] text-[#6936F5] rounded-lg hover:bg-[#6936F5] hover:text-white transition font-bold text-lg tracking-wide"
              >
                PAY MANUALLY
              </button>
            </div>
          </div>
        )}

        {/* Repayment Modals */}
        {showRepaymentModal && loan && (
          <RepaymentModal
            loan={loan}
            lenderAddress={lenderWallet || "0x1234...5678"}
            onClose={() => setShowRepaymentModal(false)}
          />
        )}
        
        {showWalletRepayment && loan && lenderWallet && (
          <WalletRepaymentModal
            loan={loan}
            lenderAddress={lenderWallet}
            onClose={() => setShowWalletRepayment(false)}
          />
        )}
      </div>
    </div>
  )
}