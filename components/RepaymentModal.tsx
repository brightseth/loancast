'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loan } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react'
import { RepaymentCastComposer } from './RepaymentCastComposer'

interface RepaymentModalProps {
  loan: Loan
  lenderAddress: string
  onClose: () => void
}

export function RepaymentModal({ loan, lenderAddress, onClose }: RepaymentModalProps) {
  const router = useRouter()
  const [txHash, setTxHash] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verification, setVerification] = useState<any>(null)
  const [error, setError] = useState('')
  const [showCastComposer, setShowCastComposer] = useState(false)
  const [castPosted, setCastPosted] = useState(false)

  const handleVerify = async () => {
    if (!txHash) {
      setError('Please enter a transaction hash')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const response = await fetch(`/api/loans/${loan.id}/verify-repayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_hash: txHash }),
      })

      const result = await response.json()

      if (result.isValid) {
        setVerification(result)
        
        // Post repayment confirmation cast
        await fetch(`/api/loans/${loan.id}/mark-repaid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx_hash: txHash }),
        })

        // Show cast composer after verification
        setShowCastComposer(true)
      } else {
        setError(result.error || 'Verification failed. Please check the transaction.')
      }
    } catch (err) {
      setError('Failed to verify transaction. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Mark Loan as Repaid</h2>

        {!verification ? (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-900 mb-2">Repayment Instructions</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Send ${loan.repay_usdc?.toFixed(2)} USDC to the lender</li>
                <li>2. Lender address: <code className="text-xs bg-blue-100 px-1 rounded">{lenderAddress.slice(0, 6)}…{lenderAddress.slice(-4)}</code></li>
                <li>3. Enter the transaction hash below</li>
              </ol>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Hash
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-farcaster focus:border-farcaster"
                disabled={verifying}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Important</p>
                  <p>Make sure you have sent the exact repayment amount to the lender's wallet before marking as repaid.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={verifying || !txHash}
                className="flex-1 bg-[#6936F5] text-white py-2 px-4 rounded-md font-medium hover:bg-[#5929cc] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Mark Repaid'
                )}
              </button>
              <button
                onClick={onClose}
                disabled={verifying}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Repayment Verified</h3>
            <p className="text-gray-600 mb-4">
              Transaction confirmed on Base blockchain
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-left text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${verification.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Block:</span>
                <span className="font-medium">{verification.blockNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TX Hash:</span>
                <a
                  href={`https://basescan.org/tx/${verification.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6936F5] hover:underline text-xs"
                >
                  {verification.txHash.slice(0, 10)}...
                </a>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Share Success</h4>
                <span className="text-xs text-gray-500">Optional</span>
              </div>
              
              <button
                onClick={() => {
                  const text = `✅ Repaid $${loan.repay_usdc?.toFixed(0)} USDC loan on time via LoanCast.\n\nBuilding reputation on-chain. Social lending works.\n\n/loancast`
                  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
                  window.open(warpcastUrl, '_blank')
                  setCastPosted(true)
                  setTimeout(() => {
                    router.push('/loans')
                    router.refresh()
                  }, 1000)
                }}
                className="w-full bg-[#6936F5] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#5929cc] transition mb-2"
              >
                Quote-cast repayment
              </button>
              
              <button
                onClick={() => {
                  router.push('/loans')
                  router.refresh()
                }}
                className="w-full text-gray-500 py-1 px-4 rounded-lg font-medium hover:text-gray-700 transition text-sm"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}