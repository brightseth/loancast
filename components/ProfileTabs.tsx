'use client'

import { useState } from 'react'
import LoanCard from './LoanCard'

interface ProfileTabsProps {
  borrowed: any[]
  lent: any[]
}

export default function ProfileTabs({ borrowed, lent }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>('borrowed')

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Loan History</h2>
      
      {/* Interactive tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('borrowed')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'borrowed' 
              ? 'border-[#6936F5] text-[#6936F5]' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Borrowed ({borrowed.length})
        </button>
        <button
          onClick={() => setActiveTab('lent')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'lent' 
              ? 'border-[#6936F5] text-[#6936F5]' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Lent ({lent.length})
        </button>
      </div>
      
      {/* Show active tab content */}
      {activeTab === 'borrowed' && (
        <>
          {borrowed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {borrowed.map((loan: any) => (
                <LoanCard 
                  key={loan.id} 
                  loan={loan} 
                  userRole="borrower"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No borrowed loans yet
            </div>
          )}
        </>
      )}

      {activeTab === 'lent' && (
        <>
          {lent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lent.map((loan: any) => (
                <LoanCard 
                  key={loan.id} 
                  loan={loan} 
                  userRole="lender"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No lent loans yet
            </div>
          )}
        </>
      )}
    </div>
  )
}