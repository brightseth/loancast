'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loanSchema = z.object({
  amount: z.number().min(1).max(10000),
  purpose: z.string().min(5).max(280),
  dueDate: z.string().min(1),
})

type LoanFormData = z.infer<typeof loanSchema>

interface MiniAppLoanFormProps {
  onSuccess: () => void
}

export function MiniAppLoanForm({ onSuccess }: MiniAppLoanFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
  })

  const onSubmit = async (data: LoanFormData) => {
    setSubmitting(true)
    setError('')

    try {
      // Get Farcaster context
      const { sdk } = await import('@farcaster/miniapp-sdk')
      const context = await sdk.context.get()

      if (!context.user?.fid) {
        throw new Error('Please sign in with Farcaster')
      }

      // Create loan request
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          borrowerFid: context.user.fid,
          interestRate: 0.02, // 2% monthly
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create loan request')
      }

      const loan = await response.json()

      // Create cast about the loan
      await sdk.actions.composeCast({
        text: `Need $${data.amount} for ${data.purpose}. Will repay $${(data.amount * 1.02).toFixed(2)} by ${new Date(data.dueDate).toLocaleDateString()}. Help me out! 🤝\n\nloancast.app/loans/${loan.id}`,
        embeds: [`https://loancast.app/loans/${loan.id}`],
      })

      reset()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (USDC)
        </label>
        <input
          type="number"
          step="0.01"
          placeholder="100"
          {...register('amount', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6936F5] focus:border-transparent"
        />
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What's it for?
        </label>
        <textarea
          placeholder="Rent payment, emergency expense, etc."
          {...register('purpose')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6936F5] focus:border-transparent"
        />
        {errors.purpose && (
          <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Repayment Date
        </label>
        <input
          type="date"
          {...register('dueDate')}
          min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6936F5] focus:border-transparent"
        />
        {errors.dueDate && (
          <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-blue-800 text-sm">
          💡 <strong>2% monthly rate.</strong> A $100 loan repaid in 30 days costs $102 total.
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#6936F5] text-white font-semibold py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-[#6936F5] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submitting ? 'Creating Request...' : 'Request Loan & Cast'}
      </button>
    </form>
  )
}