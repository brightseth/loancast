'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { LoanForm } from '@/components/LoanForm'
import { LoanSuccess } from '@/components/LoanSuccess'

export default function NewLoan() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdLoan, setCreatedLoan] = useState<any>(null)

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
    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          borrower_fid: user.fid,
        }),
      })

      if (response.ok) {
        const loan = await response.json()
        setCreatedLoan(loan)
      } else {
        throw new Error('Failed to create loan')
      }
    } catch (error) {
      console.error('Error creating loan:', error)
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