import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { RepaymentInitSchema, weiToUsdc, usdcToWei, LoanError } from '@/lib/domain-types'
import { z } from 'zod'

// Initialize repayment - returns wallet deep link and expected amount
export async function POST(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
  try {
    const body = await request.json()
    const { borrowerAddr, lenderAddr } = RepaymentInitSchema.parse({
      ...body,
      loanId: params.loanId,
      expectedAmount: '0' // Will calculate
    })
    
    // Get loan details
    const { data: loan, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', params.loanId)
      .single()
    
    if (error || !loan) {
      throw new LoanError('Loan not found', 'LOAN_NOT_FOUND', params.loanId)
    }
    
    // Validate loan can be repaid
    if (loan.status !== 'funded' && loan.status !== 'due' && loan.status !== 'overdue') {
      throw new LoanError(
        `Cannot repay loan in status: ${loan.status}`, 
        'INVALID_LOAN_STATUS',
        params.loanId
      )
    }
    
    // Verify borrower identity
    if (loan.lender_addr && lenderAddr.toLowerCase() !== loan.lender_addr.toLowerCase()) {
      throw new LoanError('Lender address mismatch', 'LENDER_MISMATCH', params.loanId)
    }
    
    // Calculate exact repayment amount
    const expectedAmount = loan.repay_expected_usdc || BigInt(0)
    const expectedUsdc = weiToUsdc(BigInt(expectedAmount))
    
    // Generate wallet deep link (Base network)
    const deepLink = `https://wallet.coinbase.com/send?` + new URLSearchParams({
      address: lenderAddr,
      amount: expectedUsdc.toString(),
      token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC on Base
      chainId: '8453' // Base
    }).toString()
    
    // Store repayment intent (for tracking)
    const { error: intentError } = await supabaseAdmin
      .from('repayment_intents')
      .upsert({
        loan_id: params.loanId,
        borrower_addr: borrowerAddr,
        lender_addr: lenderAddr,
        expected_amount: expectedAmount.toString(),
        status: 'initiated',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      })
    
    if (intentError) {
      console.error('Failed to store repayment intent:', intentError)
    }
    
    return NextResponse.json({
      success: true,
      repayment: {
        loanId: params.loanId,
        expectedAmount: expectedAmount.toString(),
        expectedUsdc,
        borrowerAddr,
        lenderAddr,
        deepLink,
        instructions: [
          'Click the wallet link below to open your wallet',
          `Send exactly ${expectedUsdc} USDC to the lender`,
          'Return here after sending to verify payment',
          'Do not send from an exchange - use your personal wallet'
        ]
      }
    })
    
  } catch (error) {
    console.error('Repayment init error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof LoanError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === 'LOAN_NOT_FOUND' ? 404 : 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to initialize repayment' },
      { status: 500 }
    )
  }
}