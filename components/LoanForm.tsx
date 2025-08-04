'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addDays, format } from 'date-fns'

const loanSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(10, 'Minimum loan amount is $10')
    .max(5000, 'Maximum loan amount is $5,000'),
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
  
  // Fixed 2% monthly rate (24% APR)
  const monthlyRate = 0.02
  const totalInterest = amount * monthlyRate * durationMonths
  const repayAmount = amount + totalInterest
  const dueDate = addDays(new Date(), durationMonths * 30)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-900 mb-2">⚠️ Trust-Based Lending</h3>
        <p className="text-sm text-amber-800">
          LoanCast operates on social reputation. There is no escrow or collateral. 
          Your loan request will become a public cast on Farcaster, and repayment 
          relies on maintaining your social reputation.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Loan Amount (USDC)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            step="0.01"
            min="10"
            max="5000"
            {...register('amount', { 
              valueAsNumber: true,
              setValueAs: (v) => v === '' ? undefined : Number(v)
            })}
            className="focus:ring-farcaster focus:border-farcaster block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="100.00"
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interest Rate
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Fixed Monthly Rate</p>
              <p className="text-xs text-gray-600">2% per month (24% APR)</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-farcaster">2%</p>
              <p className="text-xs text-gray-500">monthly</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loan Term
        </label>
        
        {/* Month Selection Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { months: 1, label: '1 Month', days: 30 },
            { months: 2, label: '2 Months', days: 60 }, 
            { months: 3, label: '3 Months', days: 90 }
          ].map(({ months, label, days }) => (
            <button
              key={months}
              type="button"
              onClick={() => setValue('duration_months', months)}
              className={`px-4 py-3 text-sm font-medium border rounded-md transition ${
                durationMonths === months
                  ? 'bg-farcaster text-white border-farcaster'
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
        <h3 className="text-sm font-medium text-blue-900 mb-2">📱 Your Farcaster Cast Preview</h3>
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <div className="text-sm font-mono whitespace-pre-line text-gray-800">
{`🏦 LOANCAST REQUEST

Amount: $${amount?.toFixed(2) || '0.00'} USDC
Rate: 2% monthly (24% APR)
Repay: $${repayAmount.toFixed(2)}
Due: ${format(dueDate, 'M/d/yyyy')}

Fixed rate social lending on Farcaster.
Powered by @loancast`}
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          ✨ This cast will be posted to Farcaster as a collectible that lenders can bid on
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Loan Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Loan Amount:</span>
            <span className="font-medium">${amount?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Interest (2% × {durationMonths} month{durationMonths !== 1 ? 's' : ''}):</span>
            <span className="font-medium">${totalInterest.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total Repayment:</span>
            <span>${repayAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-600">Due Date:</span>
            <span className="font-medium">{format(dueDate, 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Effective APR:</span>
            <span className="font-medium text-farcaster">24%</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-farcaster text-white py-2 px-4 rounded-md font-medium hover:bg-farcaster-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating Loan...' : 'Create LoanCast'}
      </button>
      </div>
    </form>
  )
}