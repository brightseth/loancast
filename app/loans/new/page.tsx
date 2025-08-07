'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { LoanForm } from '@/components/LoanForm'
import { LoanSuccess } from '@/components/LoanSuccess'
import { useAnalytics } from '@/lib/analytics'

export default function NewLoan() {
  const router = useRouter()
  const { user } = useAuth()
  const analytics = useAnalytics()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdLoan, setCreatedLoan] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    analytics.featureUsed('Loan Creation Page Viewed')
  }, [])

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please sign in to create a loan request.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null) // Clear previous errors
    analytics.formStarted('Loan Creation')
    
    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          borrower_fid: user.fid,
          signer_uuid: user.signerUuid, // Pass signer UUID for auto-posting
        }),
      })

      if (response.ok) {
        const loan = await response.json()
        setCreatedLoan(loan)
        
        // Track successful loan creation
        analytics.loanCreated({
          loanId: loan.id,
          amount: Number(data.amount),
          duration: Number(data.duration_months),
          apr: Number(data.apr || 24), // Default 2% monthly = 24% annual
          borrowerFid: user.fid.toString(),
        })
        analytics.formCompleted('Loan Creation')
        
      } else {
        // Try to get specific error message from response
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `Server error (${response.status})`
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Error creating loan:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Set user-friendly error message
      if (errorMessage.includes('Rate limit')) {
        setError('Too many requests. Please wait a moment and try again.')
      } else if (errorMessage.includes('Authentication')) {
        setError('Please sign in again to create a loan.')
      } else if (errorMessage.includes('Amount')) {
        setError('Please enter a valid loan amount between $10 and $5,000.')
      } else if (errorMessage.includes('Duration')) {
        setError('Please select a loan duration between 1-3 months.')
      } else {
        setError('Unable to create loan. Please check your internet connection and try again.')
      }
      
      analytics.errorOccurred({
        message: errorMessage,
        page: '/loans/new',
        userId: user.fid.toString(),
      })
      analytics.formAbandoned('Loan Creation', 'submission_error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdLoan) {
    return (
      <div className="max-w-screen-md mx-auto p-4 py-12">
        <LoanSuccess 
          loan={createdLoan} 
          onNewLoan={() => setCreatedLoan(null)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-screen-md mx-auto p-4 py-12">
      <h1 className="text-3xl font-bold mb-8">New LoanCast</h1>
      
      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error creating loan</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      
      <LoanForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}