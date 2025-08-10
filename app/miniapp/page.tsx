'use client'

import { useState, useEffect } from 'react'
import { MiniAppLoanForm } from '../../components/MiniAppLoanForm'
import LoanCard from '../../components/LoanCard'
import { ReputationCard } from '../../components/ReputationCard'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Loan } from '../../lib/supabase'

export default function MiniApp() {
  const [activeTab, setActiveTab] = useState<'borrow' | 'lend' | 'profile'>('borrow')
  const [loans, setLoans] = useState<Loan[]>([])
  const [userReputation, setUserReputation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Initialize Farcaster SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        // Import SDK dynamically to avoid SSR issues
        const { sdk } = await import('@farcaster/miniapp-sdk')
        
        // Initialize SDK
        await sdk.actions.ready()
        
        // Get user context
        const context = await sdk.context
        setUser(context)
        
        // Fetch user's loans and reputation
        await Promise.all([
          fetchLoans(),
          fetchUserReputation(context?.user?.fid?.toString())
        ])
      } catch (error) {
        console.error('Failed to initialize SDK:', error)
      } finally {
        setLoading(false)
      }
    }

    initSDK()
  }, [])

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans?limit=10&status=active')
      const data = await response.json()
      setLoans(data.loans || [])
    } catch (error) {
      console.error('Failed to fetch loans:', error)
    }
  }

  const fetchUserReputation = async (fid: string) => {
    if (!fid) return
    
    try {
      const response = await fetch(`/api/user/${fid}/reputation`)
      const data = await response.json()
      setUserReputation(data)
    } catch (error) {
      console.error('Failed to fetch reputation:', error)
    }
  }

  const handleLoanSuccess = () => {
    // Show success and refresh loans
    fetchLoans()
  }

  const handleFundLoan = async (loanId: string, amount: number) => {
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk')
      
      // Request wallet interaction
      await sdk.actions.sendToken({
        token: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS!,
        amount: amount.toString()
      })
      
      // Update loan status
      await fetch(`/api/loans/${loanId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, fid: user?.user?.fid })
      })
      
      fetchLoans()
    } catch (error) {
      console.error('Failed to fund loan:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#6936F5]">LoanCast</h1>
            {user && (
              <div className="text-sm text-gray-600">
                @{user?.user?.username}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b">
        <div className="flex">
          {[
            { key: 'borrow', label: 'Borrow', icon: '💰' },
            { key: 'lend', label: 'Lend', icon: '🤝' },
            { key: 'profile', label: 'Profile', icon: '👤' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-[#6936F5] border-b-2 border-[#6936F5] bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="px-4 py-4">
        {activeTab === 'borrow' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Request a Loan</h2>
              <MiniAppLoanForm onSuccess={handleLoanSuccess} />
            </div>
          </div>
        )}

        {activeTab === 'lend' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Active Loans</h2>
            {loans.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center">
                <p className="text-gray-500">No active loans available</p>
              </div>
            ) : (
              loans.map(loan => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  userRole="lender"
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Reputation</h2>
            {user?.user?.fid ? (
              <ReputationCard userFid={user.user.fid} />
            ) : (
              <div className="bg-white rounded-lg p-6 text-center">
                <p className="text-gray-500">No reputation data yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Complete your first loan to start building reputation
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8 py-4 px-4 text-center">
        <p className="text-xs text-gray-500">
          🎭 Trust-based lending on Farcaster
        </p>
      </footer>
    </div>
  )
}