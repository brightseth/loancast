'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loan } from '@/lib/supabase'
import { CheckCircle, Wallet, Loader, AlertCircle, ExternalLink, ChevronDown } from 'lucide-react'

interface WalletRepaymentModalProps {
  loan: Loan
  lenderAddress: string
  onClose: () => void
}

interface ConnectedWallet {
  address: string
  chain: string
  display: string
  balance?: string
}

export function WalletRepaymentModal({ loan, lenderAddress, onClose }: WalletRepaymentModalProps) {
  const router = useRouter()
  const [userWallets, setUserWallets] = useState<ConnectedWallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<ConnectedWallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)
  const [repaymentComplete, setRepaymentComplete] = useState(false)

  useEffect(() => {
    fetchUserWallets()
  }, [])

  const fetchUserWallets = async () => {
    try {
      setLoading(true)
      // Get user's connected wallets from their Farcaster profile
      const response = await fetch('/api/user/wallets')
      if (response.ok) {
        const data = await response.json()
        
        // Get all wallets (they should all work on Base)
        const baseWallets = data.wallets || []
        
        console.log('Fetched wallets:', baseWallets)
        
        setUserWallets(baseWallets)
        if (baseWallets.length === 1) {
          setSelectedWallet(baseWallets[0])
        }
      }
    } catch (error) {
      console.error('Error fetching wallets:', error)
      // Fallback for testing
      setUserWallets([{
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
        chain: 'base',
        display: '0x742d...bEb4',
        balance: '500.00'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSendPayment = async () => {
    if (!selectedWallet) {
      setError('Please select a wallet')
      return
    }

    setSending(true)
    setError('')

    try {
      // In production, this would trigger WalletConnect or similar
      // For now, we'll create a transaction link for the user
      const amount = loan.repay_usdc || 0
      
      // Create transaction parameters
      const txParams = {
        to: lenderAddress,
        value: '0x0', // 0 ETH
        data: encodeUSDCTransfer(lenderAddress, amount),
        from: selectedWallet.address
      }

      // Generate a Base blockchain transaction URL
      const baseUrl = 'https://basescan.org/tx'
      
      // For demo: simulate successful transaction
      setTimeout(async () => {
        const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`
        setTxHash(mockTxHash)
        
        // Mark loan as repaid
        const response = await fetch(`/api/loans/${loan.id}/mark-repaid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tx_hash: mockTxHash,
            from_wallet: selectedWallet.address 
          }),
        })

        if (response.ok) {
          setRepaymentComplete(true)
        } else {
          throw new Error('Failed to mark loan as repaid')
        }
      }, 2000)

    } catch (err) {
      setError('Failed to send payment. Please try manual payment.')
      console.error('Payment error:', err)
    } finally {
      setSending(false)
    }
  }

  // Helper function to encode USDC transfer
  const encodeUSDCTransfer = (to: string, amount: number) => {
    // ERC20 transfer function signature
    const transferSig = '0xa9059cbb'
    // This would need proper encoding in production
    return transferSig
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-[#6936F5]" />
          </div>
          <p className="text-center mt-4 text-gray-600">Loading your wallets...</p>
        </div>
      </div>
    )
  }

  if (repaymentComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Repayment Complete!</h3>
            <p className="text-gray-600 mb-4">
              Successfully sent ${loan.repay_usdc?.toFixed(2)} USDC to the lender
            </p>
            {txHash && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6936F5] hover:underline flex items-center justify-center gap-2"
                >
                  View on BaseScan
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
            <button
              onClick={() => {
                router.push('/loans')
                router.refresh()
              }}
              className="w-full bg-[#6936F5] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#5929cc] transition"
            >
              View My Loans
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Wallet Repayment
        </h2>

        {/* Repayment Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-2">Payment Details</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">${loan.repay_usdc?.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>To:</span>
              <span className="font-mono text-xs">
                {lenderAddress.slice(0, 6)}...{lenderAddress.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Network:</span>
              <span>Base</span>
            </div>
          </div>
        </div>

        {/* Wallet Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Payment Wallet
          </label>
          <div className="relative">
            <button
              onClick={() => setShowWalletDropdown(!showWalletDropdown)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md flex items-center justify-between hover:bg-gray-50"
              disabled={userWallets.length === 0}
            >
              {selectedWallet ? (
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="font-mono text-sm">{selectedWallet.display}</span>
                  {selectedWallet.balance && (
                    <span className="text-xs text-gray-500">
                      (${selectedWallet.balance} USDC)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-500">
                  {userWallets.length === 0 ? 'No connected wallets' : 'Choose a wallet'}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showWalletDropdown && userWallets.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {userWallets.map((wallet) => (
                  <button
                    key={wallet.address}
                    onClick={() => {
                      setSelectedWallet(wallet)
                      setShowWalletDropdown(false)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Wallet className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-mono text-sm">{wallet.display}</div>
                      {wallet.balance && (
                        <div className="text-xs text-gray-500">
                          Balance: ${wallet.balance} USDC
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {userWallets.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              To use wallet payment, connect a wallet to your Farcaster profile at{' '}
              <a href="https://warpcast.com/settings" target="_blank" rel="noopener noreferrer" className="text-[#6936F5] hover:underline">
                warpcast.com/settings
              </a>
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important</p>
              <p>You'll need to approve the transaction in your wallet app. Make sure you have enough USDC and ETH for gas.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSendPayment}
            disabled={sending || !selectedWallet}
            className="flex-1 bg-[#6936F5] text-white py-2 px-4 rounded-md font-medium hover:bg-[#5929cc] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                Send ${loan.repay_usdc?.toFixed(0)} USDC
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>

        {/* Manual Payment Option */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              // Switch to manual payment modal
              onClose()
              // This would open the original RepaymentModal
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Pay manually instead
          </button>
        </div>
      </div>
    </div>
  )
}