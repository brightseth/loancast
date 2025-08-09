import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fmtUsdc } from '@/lib/usdc'
import { checkRateLimit } from '@/lib/rate-limiting'
// import { // reportError } from '@/lib/observability'
import { z } from 'zod'

// Schema for loan updates (only pre-funding)
const UpdateLoanSchema = z.object({
  description: z.string().min(10).max(500).optional(),
  borrower_addr: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, '/api/loans')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      )
    }

    const { id } = params

    // Get loan details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select(`
        id,
        loan_number,
        cast_hash,
        start_ts,
        borrower_fid,
        lender_fid,
        borrower_addr,
        lender_addr,
        gross_usdc,
        repay_usdc,
        status,
        description,
        due_ts,
        tx_repay,
        verified_repayment,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Format loan for response
    const formattedLoan = {
      ...loan,
      amount_usdc_formatted: loan.gross_usdc ? loan.gross_usdc.toFixed(2) : '0.00',
      repay_expected_formatted: loan.repay_usdc ? loan.repay_usdc.toFixed(2) : '0.00'
    }

    return NextResponse.json(formattedLoan, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
      }
    })
  } catch (error) {
    // reportError(error instanceof Error ? error : new Error('Unknown error'), {
    //   loan_id: params.id,
    //   endpoint: 'GET /api/loans/[id]'
    // })
    return NextResponse.json(
      { error: 'Failed to fetch loan' },
      { status: 500 }
    )
  }
}

// PATCH for updating loan (pre-funding only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, '/api/loans')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      )
    }

    const { id } = params
    const body = await request.json()
    const validatedData = UpdateLoanSchema.parse(body)

    // Get current loan to check status
    const { data: currentLoan, error: fetchError } = await supabaseAdmin
      .from('loans')
      .select('status, borrower_fid')
      .eq('id', id)
      .single()

    if (fetchError || !currentLoan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Only allow updates if status is 'open' or 'draft' 
    if (!['open', 'draft'].includes(currentLoan.status)) {
      return NextResponse.json(
        { error: 'Cannot update loan after funding' },
        { status: 400 }
      )
    }

    // Update loan
    const { data: updatedLoan, error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      // reportError(new Error(`Loan update failed: ${updateError.message}`), {
      //   loan_id: id,
      //   endpoint: 'PATCH /api/loans/[id]'
      // })
      return NextResponse.json(
        { error: 'Failed to update loan' },
        { status: 500 }
      )
    }

    // Format response
    const formattedLoan = {
      ...updatedLoan,
      amount_usdc_formatted: updatedLoan.gross_usdc ? updatedLoan.gross_usdc.toFixed(2) : '0.00',
      repay_expected_formatted: updatedLoan.repay_usdc ? updatedLoan.repay_usdc.toFixed(2) : '0.00'
    }

    return NextResponse.json(formattedLoan, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    // reportError(error instanceof Error ? error : new Error('Unknown error'), {
    //   loan_id: params.id,
    //   endpoint: 'PATCH /api/loans/[id]'
    // })
    
    return NextResponse.json(
      { error: 'Failed to update loan' },
      { status: 500 }
    )
  }
}

// Note: DELETE method removed for security - loans should not be deletable by clients