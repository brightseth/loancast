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
import { getVerifiedRepaymentAddress } from '@/lib/cast-nft-lookup'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'

// Initialize repayment - returns wallet target computed server-side
export async function POST(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = await checkRateLimit(identifier, 10, 60000)
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const validatedData = RepaymentInitSchema.parse({
      ...body,
      loanId: params.loanId
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
    
    // Get verified repayment address from Cast NFT holder
    console.log('Looking up NFT holder for repayment address...')
    const repaymentResult = await getVerifiedRepaymentAddress(loan.cast_hash, loan.lender_fid)
    
    if (!repaymentResult.verified) {
      console.error('Repayment address verification failed:', repaymentResult.error)
      throw new LoanError(
        repaymentResult.error || 'Could not verify repayment address from Cast NFT holder',
        'REPAYMENT_ADDRESS_VERIFICATION_FAILED',
        params.loanId
      )
    }
    
    const lenderAddr = repaymentResult.repaymentAddress
    console.log('Verified repayment address:', lenderAddr)
    console.log('NFT holder verified against connected addresses:', repaymentResult.connectedAddresses)
    
    // Calculate exact repayment amount server-side
    let expectedAmount: number
    if (loan.repay_usdc) {
      expectedAmount = loan.repay_usdc
    } else {
      // Calculate from principal + 2% if not pre-calculated
      const principal = loan.gross_usdc || 0
      expectedAmount = principal * 1.02 // 2% interest
    }
    
    const expectedUsdc = expectedAmount
    
    // Store repayment intent (skip if table doesn't exist)
    try {
      await supabaseAdmin
        .from('repayment_intents')
        .upsert({
          loan_id: params.loanId,
          borrower_addr: validatedData.borrowerAddr,
          lender_addr: lenderAddr,
          expected_amount: expectedAmount.toString(),
          status: 'initiated',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        }, {
          onConflict: 'loan_id,status'
        })
    } catch (intentError) {
      // Log but don't fail if repayment_intents table doesn't exist yet
      console.warn('Repayment intent storage failed (table may not exist):', 
        intentError instanceof Error ? intentError.message : String(intentError))
    }
    
    // Return wallet target computed server-side
    return NextResponse.json({
      success: true,
      target: {
        to: lenderAddr,
        amount: expectedAmount.toFixed(6), // Full precision
        memo: `LoanCast repayment #${loan.loan_number || loan.id.substring(0, 8)}`,
        chainId: BASE_CHAIN_ID,
        token: USDC_CONTRACT_ADDRESS
      },
      repayment: {
        loanId: params.loanId,
        expectedAmount: expectedAmount.toString(),
        expectedUsdc: expectedAmount.toFixed(2),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        instructions: [
          `Send exactly ${expectedAmount.toFixed(2)} USDC to the lender address`,
          'Use the wallet deep link or copy the details above',
          'Return here after sending to verify payment on-chain',
          'Payment must come from your registered wallet address'
        ]
      }
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
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