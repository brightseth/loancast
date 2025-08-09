'use client'

import { useState, useEffect } from 'react'

interface CollectionStatusProps {
  castHash: string
  loanId: string
  currentStatus: string
  maxAmount: number
}

export function CollectionStatus({ 
  castHash, 
  loanId, 
  currentStatus,
  maxAmount 
}: CollectionStatusProps) {
  const [status, setStatus] = useState(currentStatus)
  const [collectionAmount, setCollectionAmount] = useState<number | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  
  // Explain how collections work
  const renderExplanation = () => {
    if (status === 'open') {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-semibold text-blue-900 mb-2">How Cast Collections Work:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Collect this cast on Warpcast for any amount up to ${maxAmount}</li>
            <li>Your collection amount becomes the loan amount</li>
            <li>The borrower receives 90% (after 10% platform fee)</li>
            <li>They repay your collection + 2% monthly interest</li>
          </ol>
          <p className="mt-3 text-xs text-blue-600">
            Example: Collect for $100 → Borrower gets $90 → They repay you $102
          </p>
        </div>
      )
    }
    
    if (status === 'funded' && collectionAmount) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <h4 className="font-semibold text-green-900 mb-2">Loan Funded via Collection</h4>
          <div className="space-y-1 text-sm text-green-800">
            <p>Collection Amount: ${collectionAmount}</p>
            <p>Borrower Received: ${(collectionAmount * 0.9).toFixed(2)}</p>
            <p>Repayment Due: ${(collectionAmount * 1.02).toFixed(2)}</p>
          </div>
        </div>
      )
    }
    
    return null
  }
  
  // Check for collection status
  const checkCollection = async () => {
    setIsChecking(true)
    try {
      // In production, this would check Farcaster API for collection events
      const response = await fetch(`/api/loans/${loanId}`)
      const data = await response.json()
      
      if (data.loan?.status === 'funded' && data.loan?.funding_method === 'cast_collection') {
        setStatus('funded')
        setCollectionAmount(data.loan.collection_amount_usd || data.loan.gross_usdc || 0)
      }
    } catch (error) {
      console.error('Error checking collection:', error)
    } finally {
      setIsChecking(false)
    }
  }
  
  useEffect(() => {
    // Check collection status periodically if loan is open
    if (status === 'open') {
      const interval = setInterval(checkCollection, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [status])
  
  return (
    <div className="collection-status">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-600">Funding Method:</span>
          <span className="ml-2 font-medium">
            {status === 'open' ? 'Awaiting Collection' : 'Cast Collection'}
          </span>
        </div>
        
        {status === 'open' && (
          <button
            onClick={checkCollection}
            disabled={isChecking}
            className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isChecking ? 'Checking...' : 'Check Collection Status'}
          </button>
        )}
      </div>
      
      {renderExplanation()}
      
      {status === 'open' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> Share this cast to get it collected! 
            The first collector becomes the lender.
          </p>
        </div>
      )}
    </div>
  )
}