import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  RepaymentInitSchema, 
  weiToUsdc, 
  usdc,
  formatUsdc,
  LoanError, 
  BASE_CHAIN_ID,
  USDC_CONTRACT_ADDRESS 
} from '@/lib/domain-types'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limiting'

// Initialize repayment - returns wallet target computed server-side
export async function POST(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, '/api/repay')
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const validatedData = RepaymentInitSchema.parse({
      ...body,
      loanId: params.loanId,
      expectedAmount: '0' // Will calculate server-side
    })
    
    // Get loan details with required fields
    const { data: loan, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', params.loanId)
      .single()
    
    if (error || !loan) {
      throw new LoanError('Loan not found', 'LOAN_NOT_FOUND', params.loanId)
    }
    
    // Validate loan can be repaid
    if (!['funded', 'due', 'overdue'].includes(loan.status)) {
      throw new LoanError(
        `Cannot repay loan in status: ${loan.status}`, 
        'INVALID_LOAN_STATUS',
        params.loanId
      )
    }
    
    // Verify addresses match loan data
    if (loan.borrower_addr && validatedData.borrowerAddr.toLowerCase() !== loan.borrower_addr.toLowerCase()) {
      throw new LoanError('Borrower address mismatch', 'BORROWER_MISMATCH', params.loanId)
    }
    
    if (loan.lender_addr && validatedData.lenderAddr.toLowerCase() !== loan.lender_addr.toLowerCase()) {
      throw new LoanError('Lender address mismatch', 'LENDER_MISMATCH', params.loanId)
    }
    
    // Calculate exact repayment amount server-side
    let expectedAmount: bigint
    if (loan.repay_expected_usdc) {
      expectedAmount = BigInt(loan.repay_expected_usdc)
    } else {
      // Calculate from principal + 2% if not pre-calculated
      const principal = BigInt(loan.amount_usdc || '0')
      expectedAmount = (principal * BigInt(10200)) / BigInt(10000) // 2% interest
    }
    
    const expectedUsdc = weiToUsdc(expectedAmount)
    
    // Store repayment intent (atomic operation)
    const { error: intentError } = await supabaseAdmin
      .from('repayment_intents')
      .upsert({
        loan_id: params.loanId,
        borrower_addr: validatedData.borrowerAddr,
        lender_addr: validatedData.lenderAddr,
        expected_amount: expectedAmount.toString(),
        status: 'initiated',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      }, {
        onConflict: 'loan_id,status'
      })
    
    if (intentError) {
      console.error('Failed to store repayment intent:', intentError)
      throw new Error('Failed to create repayment intent')
    }
    
    // Return wallet target computed server-side
    return NextResponse.json({
      success: true,
      target: {
        to: validatedData.lenderAddr,
        amount: formatUsdc(expectedAmount, 6), // Full precision
        memo: `LoanCast repayment #${loan.loan_number}`,
        chainId: BASE_CHAIN_ID,
        token: USDC_CONTRACT_ADDRESS
      },
      repayment: {
        loanId: params.loanId,
        expectedAmount: expectedAmount.toString(),
        expectedUsdc: formatUsdc(expectedAmount, 2),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        instructions: [
          `Send exactly ${formatUsdc(expectedAmount, 2)} USDC to the lender address`,
          'Use the wallet deep link or copy the details above',
          'Return here after sending to verify payment on-chain',
          'Payment must come from your registered wallet address'
        ]
      }
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
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