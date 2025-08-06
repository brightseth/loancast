import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createLoanCast } from '@/lib/neynar'
import { postCast, formatLoanCast } from '@/lib/neynar-post'
import { addDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOAN CREATION START ===')
    
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { amount, duration_months, borrower_fid, signer_uuid } = body

    // Validate all required fields
    if (!amount || amount < 10) {
      console.log('Invalid amount:', amount)
      return NextResponse.json(
        { error: 'Amount must be at least $10' },
        { status: 400 }
      )
    }

    if (!duration_months || duration_months < 1 || duration_months > 3) {
      console.log('Invalid duration_months:', duration_months)
      return NextResponse.json(
        { error: 'Duration must be 1-3 months' },
        { status: 400 }
      )
    }

    if (!borrower_fid) {
      console.log('Missing borrower_fid')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: 'Failed to generate loan number', details: counterError.message },
        { status: 500 }
      )
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
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
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
  } catch (error) {
    console.error('Unexpected error in POST /api/loans:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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