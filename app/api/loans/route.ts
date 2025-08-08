import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createLoanCast } from '@/lib/neynar'
import { canCreateLoans } from '@/lib/feature-flags'
import { canRequestLoan } from '@/lib/reputation'
import { addDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { withErrorHandling, createApiError } from '@/lib/error-handler'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  // Check kill switch first
  const loanCheck = canCreateLoans()
  if (!loanCheck.allowed) {
    return NextResponse.json(
      { error: loanCheck.reason },
      { status: 503 }
    )
  }

  // Check rate limit
  const { result, response } = await withRateLimit(request, rateLimiters.loanCreation)
  if (response) return response

  return withErrorHandling(async () => {
    console.log('=== LOAN CREATION START ===')
    
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { amount, duration_months, borrower_fid, signer_uuid } = body

    // Add Sentry context for this loan creation
    Sentry.setContext('loan_creation', {
      amount,
      duration_months,
      borrower_fid,
      has_signer: !!signer_uuid
    })

    // Validate all required fields
    if (!amount || amount < 10) {
      console.log('Invalid amount:', amount)
      throw createApiError('Amount must be at least $10', 400, 'INVALID_AMOUNT')
    }

    if (!duration_months || duration_months < 1 || duration_months > 3) {
      console.log('Invalid duration_months:', duration_months)
      throw createApiError('Duration must be 1-3 months', 400, 'INVALID_DURATION')
    }

    if (!borrower_fid) {
      console.log('Missing borrower_fid')
      throw createApiError('Authentication required', 401, 'AUTH_REQUIRED')
    }

    // Check reputation and loan eligibility
    const eligibility = await canRequestLoan(borrower_fid.toString(), amount)
    if (!eligibility.allowed) {
      console.log(`Loan rejected for FID ${borrower_fid}:`, eligibility.reason)
      throw createApiError(eligibility.reason || 'Loan request not allowed', 400, 'LOAN_NOT_ALLOWED')
    }

    // Fixed 2% monthly rate for all early loans
    const monthlyRate = 0.02
    const yield_bps = 200 // 2% monthly rate in basis points (2% = 200 bps)
    const totalInterest = amount * monthlyRate * duration_months
    const repayAmount = amount + totalInterest
    const dueDate = addDays(new Date(), duration_months * 30)
    console.log('Calculated repayAmount:', repayAmount, 'dueDate:', dueDate, 'duration_months:', duration_months)

    // Generate UUID for loan (no longer need sequential numbers)
    const uuid = uuidv4()
    console.log('Generated loan UUID:', uuid)

    // Try cast creation
    let cast
    let castSuccess = false
    try {
      cast = await createLoanCast(
        signer_uuid || 'default-signer',
        amount,
        yield_bps,
        dueDate
        // No longer pass loan ID to cast - using new template
      )
      console.log('Cast created:', cast)
      castSuccess = ((cast as any).success !== false) && !!cast.hash && !cast.hash.includes('failed-')
      
      // Track cast creation event
      if (castSuccess && !cast.hash.includes('mock-') && !cast.hash.includes('failed-')) {
        console.log('Real cast created successfully for loan UUID:', uuid)
      }
      
    } catch (castError) {
      console.error('Cast creation error:', castError)
      cast = { hash: `mock-${Date.now()}` } // fallback
      castSuccess = false
    }

    const loanData = {
      id: uuid,
      loan_number: null, // No longer using sequential numbers
      cast_hash: cast.hash,
      borrower_fid,
      yield_bps,
      repay_usdc: repayAmount,
      due_ts: dueDate.toISOString(),
      status: 'open',
    }

    console.log('Inserting loan data:', loanData)
    
    const { data: loan, error } = await supabaseAdmin.from('loans').insert(loanData).select().single()

    if (error) {
      console.error('Supabase error details:', error)
      throw createApiError(`Database error: ${error.message}`, 500, 'DATABASE_ERROR')
    }

    console.log('Loan created successfully:', loan)
    
    return NextResponse.json(loan)
  }, { endpoint: 'POST /api/loans' })
}

export async function GET(request: NextRequest) {
  // Check rate limit first
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams
    const borrowerFid = searchParams.get('borrower_fid')
    const lenderFid = searchParams.get('lender_fid')
    const status = searchParams.get('status')

    Sentry.setContext('loan_query', {
      borrowerFid,
      lenderFid,
      status
    })

    let query = supabaseAdmin.from('loans').select('*')

    if (borrowerFid) {
      query = query.eq('borrower_fid', borrowerFid)
    }
    if (lenderFid) {
      query = query.eq('lender_fid', lenderFid)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: loans, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching loans:', error)
      throw createApiError(`Failed to fetch loans: ${error.message}`, 500, 'FETCH_ERROR')
    }

    return NextResponse.json(loans)
  }, { endpoint: 'GET /api/loans' })
}