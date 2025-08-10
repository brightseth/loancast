'use client'

import { useState, useEffect } from 'react'

interface LoanCalculatorProps {
  className?: string
}

export function LoanCalculator({ className = '' }: LoanCalculatorProps) {
  const [amount, setAmount] = useState(500)
  const [duration, setDuration] = useState(30)
  const [purpose, setPurpose] = useState('groceries')
  
  const purposes = [
    { value: 'groceries', label: '🛒 Groceries', popular: true },
    { value: 'rent', label: '🏠 Rent Emergency', popular: true },
    { value: 'car', label: '🚗 Car Repair', popular: true },
    { value: 'education', label: '📚 Education', popular: false },
    { value: 'business', label: '💼 Business', popular: false },
    { value: 'medical', label: '🏥 Medical', popular: false },
    { value: 'other', label: '📦 Other', popular: false }
  ]

  // Calculate repayment (2% monthly rate)
  const monthlyRate = 0.02
  const repayAmount = Math.round(amount * (1 + monthlyRate * (duration / 30)))
  const interestAmount = repayAmount - amount
  
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + duration)
  
  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Try it yourself</h3>
        <p className="text-sm text-gray-600">See what your loan would look like</p>
      </div>

      <div className="space-y-4">
        {/* Amount Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How much do you need?
          </label>
          <div className="relative">
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$50</span>
              <span className="font-semibold text-purple-600">${amount}</span>
              <span>$2,000</span>
            </div>
          </div>
        </div>

        {/* Duration Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How long to repay?
          </label>
          <div className="relative">
            <input
              type="range"
              min="7"
              max="90"
              step="7"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 week</span>
              <span className="font-semibold text-purple-600">{duration} days</span>
              <span>3 months</span>
            </div>
          </div>
        </div>

        {/* Purpose Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's it for?
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {purposes.filter(p => p.popular).map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
            <optgroup label="Other purposes">
              {purposes.filter(p => !p.popular).map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Results Preview */}
      <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-600 mb-3 text-center">Your loan would be:</div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">You'll borrow:</span>
            <span className="font-semibold">${amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">You'll repay:</span>
            <span className="font-semibold text-purple-600">${repayAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Interest cost:</span>
            <span className="font-semibold text-green-600">${interestAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Due date:</span>
            <span className="font-semibold">{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Sample Cast Preview */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Your cast would say:</div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 italic">
            "Need ${amount.toLocaleString()} for {purpose.replace('_', ' ')}, will repay ${repayAmount.toLocaleString()} by {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}"
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 text-center">
        <a
          href="/loans/new"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Create this loan →
        </a>
        <p className="text-xs text-gray-500 mt-2">Takes 2 minutes • Posts to Farcaster</p>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  )
}