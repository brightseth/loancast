import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { RepaymentConfirmSchema, PaymentError, LoanError, usdcToWei, weiToUsdc, usdc } from '@/lib/domain-types'
import { checkRateLimit } from '@/lib/rate-limiting'
import { z } from 'zod'

// Verify on-chain repayment and update loan status
export async function POST(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
  try {
    // Rate limiting for repayment confirmations
    const rateLimitResult = await checkRateLimit(request, '/api/repay')
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const { txHash, fromAddr, toAddr, amount, blockNumber } = RepaymentConfirmSchema.parse({
      ...body,
      loanId: params.loanId
    })
    
    // Get loan details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', params.loanId)
      .single()
    
    if (loanError || !loan) {
      throw new LoanError('Loan not found', 'LOAN_NOT_FOUND', params.loanId)
    }
    
    // Validate loan state
    if (!['funded', 'due', 'overdue'].includes(loan.status)) {
      throw new LoanError(
        `Cannot confirm repayment for loan in status: ${loan.status}`,
        'INVALID_LOAN_STATUS',
        params.loanId
      )
    }
    
    // Check for replay attack
    const { data: existingRepayment } = await supabaseAdmin
      .from('repayments')
      .select('id')
      .eq('tx_hash', txHash)
      .single()
    
    if (existingRepayment) {
      throw new PaymentError(
        'Transaction already processed',
        'REPLAY_ATTACK',
        txHash
      )
    }
    
    // Verify payment details
    const expectedAmount = loan.repay_usdc || 0
    const actualAmount = parseFloat(amount)
    const tolerance = 0.000001 // 1 micro-USDC tolerance
    
    // Check sender is borrower (if we have their wallet)
    if (loan.borrower_addr && fromAddr.toLowerCase() !== loan.borrower_addr.toLowerCase()) {
      throw new PaymentError(
        'Payment sender does not match borrower wallet',
        'SENDER_MISMATCH',
        txHash
      )
    }
    
    // Check recipient is lender
    if (loan.lender_addr && toAddr.toLowerCase() !== loan.lender_addr.toLowerCase()) {
      throw new PaymentError(
        'Payment recipient does not match lender wallet',
        'RECIPIENT_MISMATCH',
        txHash
      )
    }
    
    // Check amount is sufficient
    if (actualAmount < expectedAmount - tolerance) {
      throw new PaymentError(
        `Insufficient payment: expected ${expectedAmount} USDC, got ${actualAmount} USDC`,
        'INSUFFICIENT_AMOUNT',
        txHash
      )
    }
    
    // Verify transaction on-chain (simplified - in production use proper RPC)
    const isValidTx = await verifyTransaction(txHash, fromAddr, toAddr, BigInt(Math.floor(actualAmount * 1e6)), blockNumber)
    if (!isValidTx) {
      throw new PaymentError(
        'Transaction verification failed',
        'VERIFICATION_FAILED',
        txHash
      )
    }
    
    // All checks passed - process repayment atomically using database function
    const { data: result, error: txError } = await supabaseAdmin.rpc('process_repayment', {
      loan_id_param: params.loanId,
      tx_hash_param: txHash,
      from_addr_param: fromAddr,
      to_addr_param: toAddr,
      amount_param: Math.floor(actualAmount * 1e6).toString(),
      block_number_param: blockNumber
    })
    
    if (txError) {
      console.error('Database transaction failed:', txError)
      throw new Error(`Database transaction failed: ${txError.message}`)
    }

    if (!result || !result.success) {
      throw new Error('Repayment processing failed')
    }
    
    // Create notifications
    await Promise.all([
      // Notify borrower
      supabaseAdmin
        .from('notifications')
        .insert({
          user_fid: loan.borrower_fid,
          type: 'repayment_confirmed',
          title: 'Repayment Confirmed',
          message: `Your repayment of ${actualAmount} USDC has been confirmed. Loan is now complete!`,
          loan_id: params.loanId,
          created_at: new Date().toISOString()
        }),
      
      // Notify lender
      supabaseAdmin
        .from('notifications')
        .insert({
          user_fid: loan.lender_fid,
          type: 'repayment_received',
          title: 'Repayment Received',
          message: `You received ${actualAmount} USDC repayment. Loan completed successfully!`,
          loan_id: params.loanId,
          created_at: new Date().toISOString()
        })
    ])
    
    return NextResponse.json({
      success: true,
      repayment: {
        loanId: params.loanId,
        txHash,
        amount: actualAmount,
        status: 'confirmed',
        verifiedAt: new Date().toISOString()
      },
      loan: {
        status: 'repaid',
        repaidAt: new Date().toISOString()
      }
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
      }
    })
    
  } catch (error) {
    console.error('Repayment confirmation error:', error)
    
    // Log to Sentry with context
    if (typeof window === 'undefined') {
      // Server-side Sentry logging
      console.error('Repayment error with context:', {
        loanId: params.loanId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof PaymentError || error instanceof LoanError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to confirm repayment' },
      { status: 500 }
    )
  }
}

// Simplified transaction verification (replace with proper Base RPC call)
async function verifyTransaction(
  txHash: string, 
  expectedFrom: string, 
  expectedTo: string, 
  expectedAmount: bigint,
  expectedBlock: number
): Promise<boolean> {
  try {
    // In production, use proper Base RPC endpoint
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      })
    })
    
    const { result } = await response.json()
    
    if (!result || result.status !== '0x1') {
      return false // Transaction failed or not found
    }
    
    // Verify block number is reasonable
    const blockNumber = parseInt(result.blockNumber, 16)
    if (Math.abs(blockNumber - expectedBlock) > 10) {
      return false
    }
    
    // For USDC transfers, we'd need to decode the logs
    // This is simplified - in production decode Transfer events
    return result.to.toLowerCase() === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' // USDC contract
    
  } catch (error) {
    console.error('Transaction verification failed:', error)
    return false
  }
}