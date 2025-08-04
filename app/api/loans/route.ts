import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createLoanCast } from '@/lib/neynar'
import { addDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOAN CREATION START ===')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { amount, duration_months, borrower_fid, signer_uuid } = body

    if (!borrower_fid) {
      console.log('Missing borrower_fid')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fixed 2% monthly rate
    const monthlyRate = 0.02
    const yield_bps = 2400 // 24% APR in basis points
    const totalInterest = amount * monthlyRate * duration_months
    const repayAmount = amount + totalInterest
    const dueDate = addDays(new Date(), duration_months * 30)
    console.log('Calculated repayAmount:', repayAmount, 'dueDate:', dueDate, 'duration_months:', duration_months)

    // Try cast creation
    let cast
    try {
      cast = await createLoanCast(
        signer_uuid || 'default-signer',
        amount,
        yield_bps,
        dueDate
      )
      console.log('Cast created:', cast)
    } catch (castError) {
      console.error('Cast creation error:', castError)
      cast = { hash: `mock-${Date.now()}` } // fallback
    }

    const loanId = uuidv4()
    const loanData = {
      id: loanId,
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
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    console.log('Loan created successfully:', loan)
    return NextResponse.json(loan)
  } catch (error) {
    console.error('Unexpected error in POST /api/loans:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const borrowerFid = searchParams.get('borrower_fid')
    const lenderFid = searchParams.get('lender_fid')
    const status = searchParams.get('status')

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
      return NextResponse.json(
        { error: 'Failed to fetch loans' },
        { status: 500 }
      )
    }

    return NextResponse.json(loans)
  } catch (error) {
    console.error('Error in GET /api/loans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}