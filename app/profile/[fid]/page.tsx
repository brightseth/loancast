'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { User, Loan } from '@/lib/supabase'
import { LoanCard } from '@/components/LoanCard'
import { ReputationProfile } from '@/components/ReputationProfile'
import { ReputationCard } from '@/components/ReputationCard'

export default function ProfilePage() {
  const params = useParams()
  const fid = params.fid as string
  
  const [user, setUser] = useState<User | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [lentLoans, setLentLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>('borrowed')

  useEffect(() => {
    if (fid) {
      fetchUserData()
    }
  }, [fid])

  const fetchUserData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch user profile
      console.log(`[ProfilePage] Starting fetch for FID: ${fid}`)
      const profileUrl = `/api/profiles/${fid}`
      console.log(`[ProfilePage] Fetching from: ${profileUrl}`)
      
      const userResponse = await fetch(profileUrl)
      
      console.log(`[ProfilePage] Response status: ${userResponse.status}`)
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        console.log('[ProfilePage] Profile data received:', userData)
        setUser(userData)
      } else {
        // Handle different error types
        const errorData = await userResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[ProfilePage] API error:', userResponse.status, errorData)
        
        if (userResponse.status === 503) {
          setError('Profile lookup is temporarily unavailable. API not configured.')
        } else if (userResponse.status === 404) {
          setError(errorData.error || 'User not found on Farcaster')
        } else {
          setError(`Profile lookup failed: ${errorData.error || 'Unknown error'}`)
        }
        return // Don't try to fetch loans if profile failed
      }

      // Fetch borrowed loans
      console.log(`[ProfilePage] Fetching borrowed loans for FID: ${fid}`)
      const borrowedResponse = await fetch(`/api/loans?borrower_fid=${fid}`)
      if (borrowedResponse.ok) {
        const borrowedData = await borrowedResponse.json()
        console.log(`[ProfilePage] Found ${borrowedData?.length || 0} borrowed loans`)
        setLoans(borrowedData || [])
      } else {
        console.error('[ProfilePage] Failed to fetch borrowed loans')
        setLoans([])
      }

      // Fetch lent loans
      console.log(`[ProfilePage] Fetching lent loans for FID: ${fid}`)
      const lentResponse = await fetch(`/api/loans?lender_fid=${fid}`)
      if (lentResponse.ok) {
        const lentData = await lentResponse.json()
        console.log(`[ProfilePage] Found ${lentData?.length || 0} lent loans`)
        setLentLoans(lentData || [])
      } else {
        console.error('[ProfilePage] Failed to fetch lent loans')
        setLentLoans([])
      }
    } catch (error) {
      console.error('[ProfilePage] Network error:', error)
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farcaster"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error ? 'Profile Error' : 'User Not Found'}
          </h1>
          <p className="text-gray-600 mb-4">
            {error || 'This user doesn\'t exist or hasn\'t used LoanCast yet.'}
          </p>
          <div className="text-sm text-gray-500 mb-4">
            <p>FID: {fid}</p>
            {error && error.includes('API not configured') && (
              <p className="mt-2 text-blue-600">
                Try test profiles: /profile/1, /profile/2, /profile/3, or /profile/12345
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#6936F5] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const displayLoans = activeTab === 'borrowed' ? loans : lentLoans

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {user.pfp_url && (
            <img
              src={user.pfp_url}
              alt={user.display_name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0"
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              {user.display_name}
            </h1>
            <p className="text-gray-600 mb-4">FID: {user.fid}</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-farcaster">{user.total_loans}</div>
                <div className="text-sm text-gray-600">Total Loans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user.loans_repaid}</div>
                <div className="text-sm text-gray-600">Repaid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-farcaster">${user.total_borrowed?.toFixed(0) || '0'}</div>
                <div className="text-sm text-gray-600">Total Borrowed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{user.credit_score}</div>
                <div className="text-sm text-gray-600">Credit Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reputation Details */}
      <div className="mb-8">
        <ReputationProfile user={user} />
      </div>

      {/* Advanced Reputation System */}
      <div className="mb-8">
        <ReputationCard userFid={parseInt(fid)} />
      </div>

      {/* Loans Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-center sm:text-left">Loan History</h2>
          <div className="flex space-x-2 justify-center sm:justify-end">
            <button
              onClick={() => setActiveTab('borrowed')}
              className={`px-3 py-2 sm:px-4 rounded-lg font-medium text-sm ${
                activeTab === 'borrowed'
                  ? 'bg-farcaster text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Borrowed ({loans.length})
            </button>
            <button
              onClick={() => setActiveTab('lent')}
              className={`px-3 py-2 sm:px-4 rounded-lg font-medium text-sm ${
                activeTab === 'lent'
                  ? 'bg-farcaster text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Lent ({lentLoans.length})
            </button>
          </div>
        </div>

        {displayLoans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayLoans.map(loan => (
              <LoanCard 
                key={loan.id} 
                loan={loan} 
                userRole={activeTab === 'borrowed' ? 'borrower' : 'lender'}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No {activeTab} loans found.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}