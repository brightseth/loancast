import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createLoanCast } from '@/lib/neynar'
import { canCreateLoans } from '@/lib/feature-flags'
import { canRequestLoan } from '@/lib/reputation'
import { toUsdc, mul102, fmtUsdc, parseUsdc } from '@/lib/usdc'
import { checkRateLimit } from '@/lib/rate-limiting'
// import { trackLoan, // reportError } from '@/lib/observability'
import { addDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

// Zod validation schema for loan creation
const CreateLoanSchema = z.object({
  amount: z.number().min(1).max(10000),
  duration_months: z.number().int().min(1).max(3),
  borrower_fid: z.number().int().positive(),
  signer_uuid: z.string().optional(),
  description: z.string().min(10).max(500).optional()
})

const LoanQuerySchema = z.object({
  borrower_fid: z.string().optional(),
  lender_fid: z.string().optional(), 
  status: z.enum(['seeking', 'funded', 'due', 'overdue', 'repaid', 'defaulted']).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20').optional()
})

export async function POST(request: NextRequest) {
  try {
    // Feature flag check
    const loanCheck = canCreateLoans()
    if (!loanCheck.allowed) {
      return NextResponse.json(
        { error: loanCheck.reason },
        { status: 503 }
      )
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, '/api/loans')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const validatedData = CreateLoanSchema.parse(body)
    
    const { amount, duration_months, borrower_fid, signer_uuid, description } = validatedData

    // Convert amount to USDC wei for storage
    const amountWei = parseUsdc(amount, 1, 10000)
    const repaymentWei = mul102(amountWei)
    const dueDate = addDays(new Date(), duration_months * 30)

    // Check borrower eligibility
    const eligibility = await canRequestLoan(borrower_fid.toString(), amount)
    if (!eligibility.allowed) {
      return NextResponse.json(
        { error: eligibility.reason || 'Loan request not allowed' },
        { status: 400 }
      )
    }

    // Generate loan ID
    const loanId = uuidv4()

    // Create Farcaster cast
    let castHash: string
    try {
      const cast = await createLoanCast(
        signer_uuid || 'default-signer',
        amount,
        200, // 2% monthly rate
        dueDate
      )
      castHash = cast.hash
    } catch (castError) {
      console.error('Cast creation failed:', castError)
      castHash = `mock-${Date.now()}`
    }

    // Store loan in database
    const loanData = {
      id: loanId,
      cast_hash: castHash,
      origin_cast_hash: castHash, // NEW: for repayment verification
      borrower_fid,
      amount_usdc: amountWei.toString(),
      repay_expected_usdc: repaymentWei.toString(), // NEW: exact repayment amount
      description: description || `Loan for ${fmtUsdc(amountWei)} USDC`,
      due_ts: dueDate.toISOString(),
      status: 'seeking',
      created_at: new Date().toISOString()
    }

    const { data: loan, error } = await supabaseAdmin
      .from('loans')
      .insert(loanData)
      .select()
      .single()

    if (error) {
      // reportError(new Error(`Loan creation failed: ${error.message}`), {
      //   loan_id: loanId,
      //   fid: borrower_fid,
      //   endpoint: 'POST /api/loans'
      // })
      return NextResponse.json(
        { error: 'Failed to create loan' },
        { status: 500 }
      )
    }

    // Track successful loan creation
    // trackLoan('loan_created', loanId, {
    //   borrower_fid,
    //   amount_usdc: amountWei.toString(),
    //   duration_days: duration_months * 30,
    //   cast_hash: castHash
    // })

    return NextResponse.json({
      ...loan,
      amount_usdc_formatted: fmtUsdc(amountWei),
      repay_expected_formatted: fmtUsdc(repaymentWei)
    }, {
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
    //   endpoint: 'POST /api/loans'
    // })
    
    return NextResponse.json(
      { error: 'Failed to create loan' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, '/api/loans')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      )
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryData = Object.fromEntries(searchParams.entries())
    const validatedQuery = LoanQuerySchema.parse(queryData)

    // Build query
    let query = supabaseAdmin
      .from('loans')
      .select(`
        id,
        loan_number,
        cast_hash,
        borrower_fid,
        lender_fid,
        gross_usdc,
        net_usdc,
        yield_bps,
        repay_usdc,
        start_ts,
        due_ts,
        status,
        tx_fund,
        tx_repay,
        created_at,
        updated_at
      `)

    if (validatedQuery.borrower_fid) {
      query = query.eq('borrower_fid', validatedQuery.borrower_fid)
    }
    if (validatedQuery.lender_fid) {
      query = query.eq('lender_fid', validatedQuery.lender_fid)
    }
    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status)
    }

    // Apply limit and ordering
    const limit = validatedQuery.limit || 20
    const { data: loans, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch loans' },
        { status: 500 }
      )
    }

    // Format amounts for client  
    const formattedLoans = loans.map(loan => ({
      ...loan,
      amount_usdc_formatted: loan.gross_usdc ? loan.gross_usdc.toFixed(2) : '0.00',
      repay_expected_formatted: loan.repay_usdc ? loan.repay_usdc.toFixed(2) : '0.00'
    }))

    return NextResponse.json(formattedLoans, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch loans' },
      { status: 500 }
    )
  }
}