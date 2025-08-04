import { createPublicClient, http, parseAbi, decodeEventLog } from 'viem'
import { base } from 'viem/chains'
import { supabaseAdmin } from './supabase'

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
})

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
const USDC_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
])

export interface RepaymentVerification {
  isValid: boolean
  txHash: string
  blockNumber: number
  from: string
  to: string
  amount: string
  timestamp: number
  error?: string
}

export async function verifyRepayment(
  loanId: string,
  txHash: string,
  expectedBorrower: string,
  expectedLender: string,
  expectedAmount: number
): Promise<RepaymentVerification> {
  try {
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    })

    if (!receipt) {
      return {
        isValid: false,
        txHash,
        blockNumber: 0,
        from: '',
        to: '',
        amount: '0',
        timestamp: 0,
        error: 'Transaction not found',
      }
    }

    // Parse USDC transfer events
    const transferEvents = receipt.logs
      .filter(log => log.address.toLowerCase() === USDC_ADDRESS.toLowerCase())
      .map(log => {
        try {
          const decoded = decodeEventLog({
            abi: USDC_ABI,
            data: log.data,
            topics: log.topics,
          })
          return decoded
        } catch {
          return null
        }
      })
      .filter(Boolean)

    if (transferEvents.length === 0) {
      return {
        isValid: false,
        txHash,
        blockNumber: Number(receipt.blockNumber),
        from: '',
        to: '',
        amount: '0',
        timestamp: 0,
        error: 'No USDC transfer found in transaction',
      }
    }

    // Find the relevant transfer
    const relevantTransfer = transferEvents.find((event: any) => {
      const from = event.args.from.toLowerCase()
      const to = event.args.to.toLowerCase()
      const amount = Number(event.args.value) / 1e6 // USDC has 6 decimals

      return (
        from === expectedBorrower.toLowerCase() &&
        to === expectedLender.toLowerCase() &&
        amount >= expectedAmount * 0.99 // Allow 1% tolerance for rounding
      )
    })

    if (!relevantTransfer) {
      return {
        isValid: false,
        txHash,
        blockNumber: Number(receipt.blockNumber),
        from: '',
        to: '',
        amount: '0',
        timestamp: 0,
        error: 'Transfer does not match loan requirements',
      }
    }

    // Get block timestamp
    const block = await publicClient.getBlock({
      blockNumber: receipt.blockNumber,
    })

    const verification: RepaymentVerification = {
      isValid: true,
      txHash,
      blockNumber: Number(receipt.blockNumber),
      from: (relevantTransfer as any).args.from,
      to: (relevantTransfer as any).args.to,
      amount: (Number((relevantTransfer as any).args.value) / 1e6).toFixed(2),
      timestamp: Number(block.timestamp),
    }

    // Store verification in database
    await supabaseAdmin.from('repayments').insert({
      loan_id: loanId,
      tx_hash: txHash,
      amount_usdc: verification.amount,
      block_number: verification.blockNumber,
      verification_method: 'onchain_base',
    })

    // Update loan status
    await supabaseAdmin
      .from('loans')
      .update({
        status: 'repaid',
        tx_repay: txHash,
      })
      .eq('id', loanId)

    // Update borrower stats
    await updateBorrowerStats(expectedBorrower, true)

    return verification
  } catch (error) {
    console.error('Error verifying repayment:', error)
    return {
      isValid: false,
      txHash,
      blockNumber: 0,
      from: '',
      to: '',
      amount: '0',
      timestamp: 0,
      error: 'Verification failed',
    }
  }
}

async function updateBorrowerStats(borrowerFid: string, isRepaid: boolean) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('fid', borrowerFid)
    .single()

  if (!user) return

  const updates: any = {
    total_loans: user.total_loans + 1,
  }

  if (isRepaid) {
    updates.loans_repaid = user.loans_repaid + 1
    updates.repayment_streak = user.repayment_streak + 1
    
    // Calculate new credit score (simple algorithm)
    const repaymentRate = (updates.loans_repaid / updates.total_loans) * 100
    const streakBonus = Math.min(updates.repayment_streak * 2, 20)
    updates.credit_score = Math.min(Math.round(repaymentRate * 0.8 + streakBonus), 100)
  } else {
    updates.loans_defaulted = (user.loans_defaulted || 0) + 1
    updates.repayment_streak = 0
    
    // Penalize credit score
    const defaultPenalty = 20
    updates.credit_score = Math.max(user.credit_score - defaultPenalty, 0)
  }

  await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('fid', borrowerFid)
}

export async function checkWalletHistory(address: string) {
  try {
    // Get recent transactions
    const balance = await publicClient.getBalance({
      address: address as `0x${string}`,
    })

    // Check USDC balance
    const usdcBalance = await publicClient.readContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    })

    return {
      ethBalance: Number(balance) / 1e18,
      usdcBalance: Number(usdcBalance) / 1e6,
      hasActivity: Number(balance) > 0 || Number(usdcBalance) > 0,
    }
  } catch (error) {
    console.error('Error checking wallet:', error)
    return null
  }
}