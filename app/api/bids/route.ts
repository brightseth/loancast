import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

// Validation schemas
const CreateBidSchema = z.object({
  loan_id: z.string().uuid(),
  bidder_fid: z.number().int().positive(),
  bid_amount: z.number().min(0.01).max(100000),
  cast_hash: z.string().optional(),
  operator_key: z.string().optional() // For manual bid recording by admins
})

const BidQuerySchema = z.object({
  loan_id: z.string().uuid().optional(),
  bidder_fid: z.string().optional(),
  status: z.enum(['active', 'withdrawn', 'winning', 'losing']).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('50').optional()
})

const UpdateBidSchema = z.object({
  bid_id: z.string().uuid(),
  status: z.enum(['active', 'withdrawn']),
  operator_key: z.string().optional() // For admin actions
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'unknown'
    const rateLimitResult = await checkRateLimit(`${ip}-bids-post`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const validatedData = CreateBidSchema.parse(body)
    
    const { loan_id, bidder_fid, bid_amount, cast_hash, operator_key } = validatedData

    // Check if operator key is required for manual entries
    const isManualEntry = !cast_hash
    if (isManualEntry) {
      const requiredOperatorKey = process.env.BID_OPERATOR_SECRET
      if (!requiredOperatorKey || operator_key !== requiredOperatorKey) {
        return NextResponse.json(
          { error: 'Unauthorized manual bid entry' },
          { status: 401 }
        )
      }
    }

    // Verify loan exists and is open for bidding
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('id, status, borrower_fid, requested_usdc')
      .eq('id', loan_id)
      .single()

    if (loanError || !loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    if (loan.status !== 'open') {
      return NextResponse.json(
        { error: 'Loan is not accepting bids' },
        { status: 400 }
      )
    }

    // Prevent self-bidding
    if (loan.borrower_fid === bidder_fid) {
      return NextResponse.json(
        { error: 'Cannot bid on own loan' },
        { status: 400 }
      )
    }

    // Check for existing active bid from this bidder on this loan
    const { data: existingBid } = await supabaseAdmin
      .from('bids')
      .select('id, bid_amount')
      .eq('loan_id', loan_id)
      .eq('bidder_fid', bidder_fid)
      .eq('status', 'active')
      .single()

    let result
    if (existingBid) {
      // Update existing bid
      const { data, error } = await supabaseAdmin
        .from('bids')
        .update({
          bid_amount,
          cast_hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingBid.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update bid' },
          { status: 500 }
        )
      }

      result = { ...data, action: 'updated', previous_amount: existingBid.bid_amount }
    } else {
      // Create new bid
      const { data, error } = await supabaseAdmin
        .from('bids')
        .insert({
          loan_id,
          bidder_fid,
          bid_amount,
          cast_hash,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create bid' },
          { status: 500 }
        )
      }

      result = { ...data, action: 'created' }
    }

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Bid creation error:', error)
    return NextResponse.json(
      { error: 'Failed to process bid' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'unknown'
    const rateLimitResult = await checkRateLimit(`${ip}-bids-get`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryData = Object.fromEntries(searchParams.entries())
    const validatedQuery = BidQuerySchema.parse(queryData)

    // Build query
    let query = supabaseAdmin
      .from('bids')
      .select(`
        id,
        loan_id,
        bidder_fid,
        bid_amount,
        bid_timestamp,
        bid_sequence,
        status,
        cast_hash,
        created_at,
        updated_at,
        loans (
          id,
          borrower_fid,
          requested_usdc,
          gross_usdc,
          status,
          description
        )
      `)

    if (validatedQuery.loan_id) {
      query = query.eq('loan_id', validatedQuery.loan_id)
    }
    if (validatedQuery.bidder_fid) {
      query = query.eq('bidder_fid', validatedQuery.bidder_fid)
    }
    if (validatedQuery.status) {
      query = query.eq('status', validatedQuery.status)
    }

    const limit = validatedQuery.limit || 50
    const { data: bids, error } = await query
      .order('bid_timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Bid fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bids' },
        { status: 500 }
      )
    }

    // Format response with additional analytics
    const formattedBids = bids.map(bid => ({
      ...bid,
      bid_amount_formatted: bid.bid_amount.toFixed(2),
      efficiency_ratio: bid.loans && typeof bid.loans === 'object' && 'requested_usdc' in bid.loans
        ? (bid.bid_amount / (bid.loans.requested_usdc || bid.bid_amount)) 
        : null
    }))

    return NextResponse.json(formattedBids, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Bid query error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'unknown'
    const rateLimitResult = await checkRateLimit(`${ip}-bids-patch`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const validatedData = UpdateBidSchema.parse(body)
    
    const { bid_id, status, operator_key } = validatedData

    // For withdrawing bids, verify bidder ownership or admin privileges
    const { data: bid, error: bidError } = await supabaseAdmin
      .from('bids')
      .select('id, bidder_fid, loan_id, status')
      .eq('id', bid_id)
      .single()

    if (bidError || !bid) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      )
    }

    // Admin override
    const isAdmin = operator_key === process.env.BID_OPERATOR_SECRET
    
    // TODO: Implement proper bidder authentication
    // For now, requiring admin key for all updates
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only bid owner or admin can update bid' },
        { status: 403 }
      )
    }

    // Update bid status
    const { data, error } = await supabaseAdmin
      .from('bids')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bid_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update bid' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...data,
      action: 'status_updated'
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Bid update error:', error)
    return NextResponse.json(
      { error: 'Failed to update bid' },
      { status: 500 }
    )
  }
}