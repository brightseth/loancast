import { createPublicClient, http, parseAbi, decodeEventLog, Log } from 'viem'
import { base } from 'viem/chains'
import { supabaseAdmin } from './supabase'
import { rpcClient } from './rpc-client'

// Farcaster Collects contract on Base
const COLLECTS_CONTRACT_ADDRESS = '0x...' // TODO: Get actual contract address from Farcaster team

// USDC contract on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// ABI for relevant events
const COLLECTS_ABI = parseAbi([
  'event CollectSettled(bytes32 indexed castHash, address indexed collector, uint256 amount, uint256 timestamp)',
  // Add other relevant events as we discover them
])

const USDC_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)'
])

interface LoanFunding {
  castHash: string
  loanId: string
  lender: string
  amount: number
  txHash: string
  blockNumber: number
  timestamp: Date
}

interface RepaymentDetection {
  loanId: string
  txHash: string
  from: string
  to: string
  amount: number
  expectedAmount: number
  blockNumber: number
  timestamp: Date
  isValid: boolean
}

// Main indexer class
export class FarcasterIndexer {
  private client = rpcClient

  // Watch for Farcaster collect settlements (loan funding)
  async watchCollectSettlements() {
    console.log('Starting Farcaster collect settlement watcher...')
    
    // For now, we'll use a different approach since we don't have the exact contract
    // We'll watch USDC transfers and match them to our loan system
    this.watchLoanFunding()
  }

  // Watch for loan funding via USDC transfers
  private async watchLoanFunding() {
    console.log('Watching for loan funding via USDC transfers...')
    
    // Get all open loans from our database
    const { data: openLoans, error } = await supabaseAdmin
      .from('loans')
      .select('id, cast_hash, borrower_fid, repay_usdc, created_at')
      .eq('status', 'open')

    if (error || !openLoans) {
      console.error('Error fetching open loans:', error)
      return
    }

    console.log(`Monitoring ${openLoans.length} open loans for funding...`)

    // Watch USDC transfers that could be loan funding
    // Note: In production, you'd want to be more specific about which transfers to watch
    this.client.getCurrentClient().watchContractEvent({
      address: USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      eventName: 'Transfer',
      onLogs: async (logs: Log[]) => {
        for (const log of logs) {
          await this.processUSDCTransfer(log, openLoans)
        }
      }
    })
  }

  // Process USDC transfers to detect loan funding
  private async processUSDCTransfer(log: Log, openLoans: any[]) {
    try {
      const decoded = decodeEventLog({
        abi: USDC_ABI,
        data: log.data,
        topics: log.topics
      })

      if (decoded.eventName !== 'Transfer') return

      const { from, to, value } = decoded.args as any
      const amount = Number(value) / 1e6 // Convert from USDC decimals

      // Check if this transfer could be loan funding
      // This is a simple heuristic - in production you'd want more sophisticated matching
      for (const loan of openLoans) {
        // Look for transfers of reasonable loan amounts (within 10% tolerance)
        const expectedAmount = parseFloat(loan.repay_usdc) / 1.02 // Back-calculate principal
        const tolerance = expectedAmount * 0.1
        
        if (Math.abs(amount - expectedAmount) <= tolerance) {
          console.log(`Potential loan funding detected: ${amount} USDC for loan ${loan.id}`)
          
          // Update loan status to funded
          await this.markLoanAsFunded({
            loanId: loan.id,
            lender: from,
            amount,
            txHash: log.transactionHash!,
            blockNumber: Number(log.blockNumber),
            timestamp: new Date()
          })
          break
        }
      }
    } catch (error) {
      console.error('Error processing USDC transfer:', error)
    }
  }

  // Mark a loan as funded
  private async markLoanAsFunded(funding: {
    loanId: string
    lender: string
    amount: number
    txHash: string
    blockNumber: number
    timestamp: Date
  }) {
    try {
      // Update loan status
      const { error: loanError } = await supabaseAdmin
        .from('loans')
        .update({
          status: 'funded',
          lender_address: funding.lender.toLowerCase(),
          tx_fund: funding.txHash,
          funded_at: funding.timestamp.toISOString()
        })
        .eq('id', funding.loanId)

      if (loanError) {
        console.error('Error updating loan status:', loanError)
        return
      }

      console.log(`✅ Loan ${funding.loanId} marked as funded by ${funding.lender}`)

      // TODO: Send notification to borrower
      // TODO: Post funding announcement cast

    } catch (error) {
      console.error('Error marking loan as funded:', error)
    }
  }

  // Watch for loan repayments
  async watchRepayments() {
    console.log('Starting repayment detection...')

    // Get all funded loans
    const { data: fundedLoans, error } = await supabaseAdmin
      .from('loans')
      .select('id, borrower_fid, lender_address, repay_usdc, due_ts')
      .eq('status', 'funded')

    if (error || !fundedLoans) {
      console.error('Error fetching funded loans:', error)
      return
    }

    console.log(`Monitoring ${fundedLoans.length} funded loans for repayment...`)

    // Watch for USDC transfers that could be repayments
    this.client.getCurrentClient().watchContractEvent({
      address: USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      eventName: 'Transfer',
      onLogs: async (logs: Log[]) => {
        for (const log of logs) {
          await this.detectRepayment(log, fundedLoans)
        }
      }
    })
  }

  // Detect loan repayments from USDC transfers
  private async detectRepayment(log: Log, fundedLoans: any[]) {
    try {
      const decoded = decodeEventLog({
        abi: USDC_ABI,
        data: log.data,
        topics: log.topics
      })

      if (decoded.eventName !== 'Transfer') return

      const { from, to, value } = decoded.args as any
      const amount = Number(value) / 1e6

      // Check if this transfer matches any expected repayment
      for (const loan of fundedLoans) {
        const expectedAmount = parseFloat(loan.repay_usdc)
        const expectedLender = loan.lender_address?.toLowerCase()
        
        // Check if amount matches (within 1% tolerance) and addresses match
        const amountTolerance = expectedAmount * 0.01
        const amountMatch = Math.abs(amount - expectedAmount) <= amountTolerance
        const addressMatch = to.toLowerCase() === expectedLender
        
        if (amountMatch && addressMatch) {
          console.log(`✅ Repayment detected for loan ${loan.id}: ${amount} USDC`)
          
          await this.processRepayment({
            loanId: loan.id,
            txHash: log.transactionHash!,
            from: from.toLowerCase(),
            to: to.toLowerCase(),
            amount,
            expectedAmount,
            blockNumber: Number(log.blockNumber),
            timestamp: new Date(),
            isValid: true
          })
          break
        }
      }
    } catch (error) {
      console.error('Error detecting repayment:', error)
    }
  }

  // Process a detected repayment
  private async processRepayment(repayment: RepaymentDetection) {
    try {
      // Update loan status to repaid
      const { error: loanError } = await supabaseAdmin
        .from('loans')
        .update({
          status: 'repaid',
          tx_repay: repayment.txHash,
          repaid_at: repayment.timestamp.toISOString()
        })
        .eq('id', repayment.loanId)

      if (loanError) {
        console.error('Error updating loan repayment:', loanError)
        return
      }

      // Record repayment details
      const { error: repayError } = await supabaseAdmin
        .from('repayments')
        .upsert({
          loan_id: repayment.loanId,
          tx_hash: repayment.txHash,
          amount_usdc: repayment.amount,
          block_number: repayment.blockNumber,
          verification_method: 'indexer_detection'
        }, { onConflict: 'tx_hash' })

      if (repayError) {
        console.error('Error recording repayment:', repayError)
      }

      // Determine if repayment was on time
      const { data: loan } = await supabaseAdmin
        .from('loans')
        .select('due_ts, borrower_fid')
        .eq('id', repayment.loanId)
        .single()

      if (loan) {
        const dueDate = new Date(loan.due_ts)
        const isOnTime = repayment.timestamp <= dueDate
        
        console.log(`Loan ${repayment.loanId} repaid ${isOnTime ? 'ON TIME' : 'LATE'}`)
        
        // Update borrower reputation
        await this.updateBorrowerReputation(loan.borrower_fid, isOnTime)
        
        // TODO: Post repayment success cast
        // TODO: Send thank you notifications
      }

    } catch (error) {
      console.error('Error processing repayment:', error)
    }
  }

  // Update borrower reputation after repayment
  private async updateBorrowerReputation(borrowerFid: string, isOnTime: boolean) {
    try {
      // Get current user stats
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('fid', borrowerFid)
        .single()

      if (!user) return

      const updates: any = {
        total_loans: user.total_loans + 1,
        loans_repaid: user.loans_repaid + 1
      }

      if (isOnTime) {
        updates.repayment_streak = user.repayment_streak + 1
        updates.credit_score = Math.min(user.credit_score + 60, 1000) // +60 for on-time
      } else {
        updates.repayment_streak = 0 // Break streak for late payment
        updates.credit_score = Math.max(user.credit_score - 60, 0) // -60 for late
      }

      // Recalculate credit score based on overall performance
      const repaymentRate = updates.loans_repaid / updates.total_loans
      const streakBonus = Math.min(updates.repayment_streak * 10, 100)
      const baseScore = 200 + repaymentRate * 300 + streakBonus
      
      updates.credit_score = Math.min(Math.round(baseScore), 1000)

      await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('fid', borrowerFid)

      console.log(`Updated reputation for FID ${borrowerFid}: score ${updates.credit_score}`)

    } catch (error) {
      console.error('Error updating borrower reputation:', error)
    }
  }

  // Start the indexer
  async start() {
    console.log('🚀 Starting Farcaster Indexer...')
    
    try {
      // Start watching for funding and repayments
      await Promise.all([
        this.watchCollectSettlements(),
        this.watchRepayments()
      ])

      console.log('✅ Farcaster Indexer is running')
    } catch (error) {
      console.error('❌ Failed to start indexer:', error)
      throw error
    }
  }

  // Sync historical events
  async syncHistorical() {
    console.log('Syncing historical events...')
    
    try {
      // Get the last 24 hours of USDC transfers
      const currentBlock = await this.client.getBlockNumber()
      const fromBlock = currentBlock - BigInt(24 * 60 * 60 / 2) // ~24 hours of blocks
      
      const logs = await this.client.getCurrentClient().getContractEvents({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        eventName: 'Transfer',
        fromBlock,
        toBlock: 'latest'
      })

      console.log(`Processing ${logs.length} historical USDC transfers...`)

      // Get open and funded loans for matching
      const [openLoans, fundedLoans] = await Promise.all([
        supabaseAdmin.from('loans').select('*').eq('status', 'open'),
        supabaseAdmin.from('loans').select('*').eq('status', 'funded')
      ])

      // Process historical transfers
      for (const log of logs) {
        if (openLoans.data) {
          await this.processUSDCTransfer(log as Log, openLoans.data)
        }
        if (fundedLoans.data) {
          await this.detectRepayment(log as Log, fundedLoans.data)
        }
      }

      console.log('✅ Historical sync complete')
    } catch (error) {
      console.error('Error syncing historical events:', error)
    }
  }
}

// Export singleton instance
export const farcasterIndexer = new FarcasterIndexer()

// Helper functions for manual operations
export async function manuallyMarkLoanFunded(loanId: string, lenderAddress: string, txHash: string) {
  console.log(`Manually marking loan ${loanId} as funded...`)
  
  const { error } = await supabaseAdmin
    .from('loans')
    .update({
      status: 'funded',
      lender_address: lenderAddress.toLowerCase(),
      tx_fund: txHash,
      funded_at: new Date().toISOString()
    })
    .eq('id', loanId)

  if (error) {
    throw new Error(`Failed to mark loan as funded: ${error.message}`)
  }

  console.log(`✅ Loan ${loanId} manually marked as funded`)
}

export async function manuallyMarkLoanRepaid(loanId: string, txHash: string) {
  console.log(`Manually marking loan ${loanId} as repaid...`)
  
  const { error } = await supabaseAdmin
    .from('loans')
    .update({
      status: 'repaid',
      tx_repay: txHash,
      repaid_at: new Date().toISOString()
    })
    .eq('id', loanId)

  if (error) {
    throw new Error(`Failed to mark loan as repaid: ${error.message}`)
  }

  console.log(`✅ Loan ${loanId} manually marked as repaid`)
}