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
        throw new Error('Failed to create loan')
      }
    } catch (error) {
      console.error('Error creating loan:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      analytics.errorOccurred({
        message: errorMessage,
        page: '/loans/new',
        userId: user.fid.toString(),
      })
      analytics.formAbandoned('Loan Creation', 'submission_error')
      alert('Failed to create loan. Please try again.')
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
      <LoanForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  )
}