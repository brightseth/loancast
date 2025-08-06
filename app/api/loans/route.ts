import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createLoanCast } from '@/lib/neynar'
import { postCast, formatLoanCast } from '@/lib/neynar-post'
import { addDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { withErrorHandling, createApiError } from '@/lib/error-handler'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
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

    // Fixed 2% monthly rate for all early loans
    const monthlyRate = 0.02
    const yield_bps = 2400 // 24% APR in basis points
    const totalInterest = amount * monthlyRate * duration_months
    const repayAmount = amount + totalInterest
    const dueDate = addDays(new Date(), duration_months * 30)
    console.log('Calculated repayAmount:', repayAmount, 'dueDate:', dueDate, 'duration_months:', duration_months)

    // Get next loan number atomically
    console.log('Getting next loan number...')
    const { data: loanNumberResult, error: counterError } = await supabaseAdmin
      .rpc('get_next_loan_number')
    
    if (counterError) {
      console.error('Error getting loan number:', counterError)
      throw createApiError(`Failed to generate loan number: ${counterError.message}`, 500, 'LOAN_NUMBER_ERROR')
    }
    
    const loanNumber = loanNumberResult
    const loanId = `LOANCAST-${loanNumber.toString().padStart(4, '0')}`
    console.log('Generated loan ID:', loanId)

    // Try cast creation
    let cast
    try {
      cast = await createLoanCast(
        signer_uuid || 'default-signer',
        amount,
        yield_bps,
        dueDate,
        loanId // Pass loan ID to the cast
      )
      console.log('Cast created:', cast)
    } catch (castError) {
      console.error('Cast creation error:', castError)
      cast = { hash: `mock-${Date.now()}` } // fallback
    }

    const uuid = uuidv4()
    const loanData = {
      id: uuid,
      loan_number: loanNumber,
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
    
    // Post to Farcaster if signer_uuid is provided
    if (signer_uuid) {
      try {
        console.log('Posting to Farcaster...')
        
        const castText = formatLoanCast({
          loanNumber: loanId,
          amount: amount,
          durationMonths: duration_months,
          dueDate: dueDate,
          yieldPercent: yield_bps / 100
        })
        
        const cast = await postCast({
          text: castText,
          signerUuid: signer_uuid
        })
        
        console.log('Cast posted successfully:', cast)
        
        // Update loan with cast hash
        if (cast.hash) {
          await supabaseAdmin
            .from('loans')
            .update({ cast_hash: cast.hash })
            .eq('id', loan.id)
        }
        
        return NextResponse.json({ ...loan, cast_hash: cast.hash, cast_url: `https://warpcast.com/${cast.author.username}/${cast.hash}` })
      } catch (castError) {
        console.error('Failed to post to Farcaster:', castError)
        // Still return the loan even if casting fails
        return NextResponse.json({ 
          ...loan, 
          warning: 'Loan created but failed to post to Farcaster. Please post manually.' 
        })
      }
    }
    
    return NextResponse.json(loan)
  }, { endpoint: 'POST /api/loans' })
}

export async function GET(request: NextRequest) {
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