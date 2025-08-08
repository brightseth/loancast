'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addDays, format } from 'date-fns'
import { useState } from 'react'

const loanSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(10, 'Minimum loan amount is $10')
    .max(1000, 'Maximum loan amount is $1,000'),
  duration_months: z
    .number({ invalid_type_error: 'Duration must be selected' })
    .min(1, 'Minimum duration is 1 month')
    .max(3, 'Maximum duration is 3 months'),
})

type LoanFormData = z.infer<typeof loanSchema>

interface LoanFormProps {
  onSubmit: (data: LoanFormData) => Promise<void>
  isSubmitting: boolean
}

export function LoanForm({ onSubmit, isSubmitting }: LoanFormProps) {
  const [castCopied, setCastCopied] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      amount: 100,
      duration_months: 1,
    },
  })

  const amount = watch('amount') || 0
  const durationMonths = watch('duration_months') || 1
  
  // Fixed 2% monthly rate for all early loans
  const monthlyRate = 0.02 // 2% monthly rate
  const annualRate = 24 // 2% × 12 months
  const farcasterFee = amount * 0.10 // 10% Farcaster fee
  const netAmount = amount - farcasterFee // Borrower receives this amount
  const totalInterest = amount * monthlyRate * durationMonths
  const repayAmount = amount + totalInterest // Borrower pays back full amount + interest
  const dueDate = addDays(new Date(), durationMonths * 30)

  const castText = `┏━━━━ 💰 LOAN REQUEST ━━━━┓

🏦 Borrow ≤ ${amount?.toLocaleString() || '0'} USDC
📅 ${durationMonths * 30} days • due ${format(dueDate, 'MMM d, yyyy')}
📈 Yield 2% monthly → repay ${repayAmount.toFixed(0)} USDC
🎯 Highest bid = lender
💰 I eat Farcaster's 10% (get ${netAmount?.toFixed(0) || '0'} USDC)
⚠️ This cast *is* the note

Cast on @loancast

┗━━━━━━━━━━━━━━━━━━━━━┛`

  const copyCastText = async () => {
    try {
      await navigator.clipboard.writeText(castText)
      setCastCopied(true)
      setTimeout(() => setCastCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg text-amber-600">🤝</span>
          <div>
            <h3 className="font-medium text-amber-900">Friend-to-Friend Loans</h3>
            <p className="text-sm text-amber-800">
              Trust-based lending between friends. No credit checks, no collateral, no securities—just social reputation and good vibes.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Max borrow (USDC)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            step="1"
            min="10"
            max="5000"
            {...register('amount', { 
              valueAsNumber: true,
              setValueAs: (v) => v === '' ? undefined : Math.floor(Number(v))
            })}
            className="focus:ring-[#6936F5] focus:border-[#6936F5] block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md"
            placeholder="100"
          />
        </div>
        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
          <div className="text-blue-700">
            <span className="text-lg">💰</span> You receive: <span className="font-medium">${netAmount.toFixed(0)}</span> after 10% fee
          </div>
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lender yield (fixed for early cohorts)
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Fixed Monthly Rate</p>
              <p className="text-xs text-gray-600">2% monthly = 24% APR</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#6936F5]">2%</p>
              <p className="text-xs text-gray-500">monthly</p>
            </div>
          </div>
          
          <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
            <span className="text-lg">🔒</span> All early LoanCasts pay 2% lender yield for 30 days.
            <div className="mt-1 text-blue-600">
              We'll unlock dynamic yields after we've published three full months of performance data.
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Repay by (date)
        </label>
        
        {/* Month Selection - Responsive */}
        <div className="md:grid md:grid-cols-3 md:gap-3 flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {[
            { months: 1, label: '1 Month', days: 30 },
            { months: 2, label: '2 Months', days: 60 }, 
            { months: 3, label: '3 Months', days: 90 }
          ].map(({ months, label, days }) => (
            <button
              key={months}
              type="button"
              onClick={() => setValue('duration_months', months)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border rounded-md transition min-w-[120px] md:min-w-0 ${
                durationMonths === months
                  ? 'bg-[#6936F5] text-white border-[#6936F5]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold">{label}</div>
                <div className="text-xs opacity-75">{days} days</div>
              </div>
            </button>
          ))}
        </div>
        
        <input
          type="hidden"
          {...register('duration_months', { valueAsNumber: true })}
        />
        
        {errors.duration_months && (
          <p className="mt-1 text-sm text-red-600">{errors.duration_months.message}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-blue-900"><span className="text-lg">📱</span> Your Farcaster Cast Preview</h3>
          <button
            type="button"
            onClick={copyCastText}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition"
            aria-label="Copy cast text to clipboard"
          >
            {castCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <div className="text-sm font-mono whitespace-pre-line text-gray-800">
            {castText}
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          <span className="text-lg">✨</span> Posted as collectible cast for lenders to bid
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Loan Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">🟢 Loan Request:</span>
            <span className="font-medium">${amount?.toFixed(0) || '0'}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>🏛️ Farcaster Fee (10%):</span>
            <span className="font-medium">-${farcasterFee.toFixed(0)}</span>
          </div>
          <div className="text-xs text-orange-600 italic mt-1">
            💡 Fee under negotiation—target 2% soon
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">💰 You Receive:</span>
            <span className="font-medium text-green-600">${netAmount.toFixed(0)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-600">📈 Interest (2% × {durationMonths} month{durationMonths !== 1 ? 's' : ''}):</span>
            <span className="font-medium">${totalInterest.toFixed(0)}</span>
          </div>
          <div className="flex justify-between font-bold text-red-600">
            <span>💸 You Repay:</span>
            <span>${repayAmount.toFixed(0)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-600">📅 Due Date:</span>
            <span className="font-medium">{format(dueDate, 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">📊 Annual Rate:</span>
            <span className="font-medium text-[#6936F5]">24%</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#6936F5] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#5929cc] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        {isSubmitting ? 'Creating loan...' : 'Post Loan Request'}
      </button>
      </div>
    </form>
  )
}