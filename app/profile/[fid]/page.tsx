'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { User, Loan } from '@/lib/supabase'
import { LoanCard } from '@/components/LoanCard'
import { ReputationProfile } from '@/components/ReputationProfile'

export default function ProfilePage() {
  const params = useParams()
  const fid = params.fid as string
  
  const [user, setUser] = useState<User | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])
  const [lentLoans, setLentLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>('borrowed')

  useEffect(() => {
    if (fid) {
      fetchUserData()
    }
  }, [fid])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // Fetch user profile
      const userResponse = await fetch(`/api/profiles/${fid}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
      }

      // Fetch borrowed loans
      const borrowedResponse = await fetch(`/api/loans?borrower_fid=${fid}`)
      if (borrowedResponse.ok) {
        const borrowedData = await borrowedResponse.json()
        setLoans(borrowedData || [])
      }

      // Fetch lent loans
      const lentResponse = await fetch(`/api/loans?lender_fid=${fid}`)
      if (lentResponse.ok) {
        const lentData = await lentResponse.json()
        setLentLoans(lentData || [])
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User not found</h1>
          <p className="text-gray-600">This user doesn't exist or hasn't used LoanCast yet.</p>
        </div>
      </div>
    )
  }

  const displayLoans = activeTab === 'borrowed' ? loans : lentLoans

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-start gap-6">
          {user.pfp_url && (
            <img
              src={user.pfp_url}
              alt={user.display_name}
              className="w-20 h-20 rounded-full"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {user.display_name}
            </h1>
            <p className="text-gray-600 mb-4">FID: {user.fid}</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Loans Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Loan History</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('borrowed')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'borrowed'
                  ? 'bg-farcaster text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Borrowed ({loans.length})
            </button>
            <button
              onClick={() => setActiveTab('lent')}
              className={`px-4 py-2 rounded-lg font-medium ${
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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