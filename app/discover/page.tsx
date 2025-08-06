'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProfileBadge } from '@/components/ProfileBadge'

interface LoanCast {
  cast_hash: string
  cast_url: string
  loan_number: string
  amount: number
  yield_percent: number
  repay_amount: number
  due_date: string
  duration_days: number
  borrower: {
    fid: number
    username: string
    display_name: string
    pfp_url: string
  }
  created_at: string
  engagement: {
    likes: number
    recasts: number
    replies: number
  }
  text: string
}

export default function DiscoverPage() {
  const [loans, setLoans] = useState<LoanCast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('LOANCAST')

  const fetchLoans = async (cursor?: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/casts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          cursor
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch loans')
      }

      const data = await response.json()
      
      if (cursor) {
        setLoans(prev => [...prev, ...data.loans])
      } else {
        setLoans(data.loans)
      }
      
      setNextCursor(data.next_cursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchLoans(nextCursor)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Discover LoanCasts</h1>
        <p className="text-gray-600">
          Browse all LoanCast requests from the Farcaster network
        </p>
      </div>

      {loading && loans.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#6936F5]"></div>
          <p className="mt-4 text-gray-600">Loading LoanCasts...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No LoanCasts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div key={loan.cast_hash} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <ProfileBadge
                  fid={loan.borrower.fid}
                  username={loan.borrower.username}
                  displayName={loan.borrower.display_name}
                  pfpUrl={loan.borrower.pfp_url}
                />
                <span className="text-sm text-gray-500">
                  {formatTimeAgo(loan.created_at)}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap mb-4">
                {loan.text}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Amount</p>
                  <p className="font-semibold">${loan.amount?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Yield</p>
                  <p className="font-semibold text-[#6936F5]">{loan.yield_percent || 'N/A'}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="font-semibold">{loan.duration_days || 'N/A'} days</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Repay</p>
                  <p className="font-semibold">${loan.repay_amount?.toLocaleString() || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {loan.engagement.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loan.engagement.recasts}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {loan.engagement.replies}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={loan.cast_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#6936F5] hover:underline"
                  >
                    View on Farcaster →
                  </a>
                  {loan.loan_number && (
                    <Link
                      href={`/loans/${loan.loan_number.toLowerCase()}`}
                      className="text-sm bg-[#6936F5] text-white px-3 py-1 rounded-md hover:bg-[#5929cc] transition"
                    >
                      View Loan
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}

          {nextCursor && (
            <div className="text-center py-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="bg-[#6936F5] text-white px-6 py-2 rounded-lg hover:bg-[#5929cc] transition disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}