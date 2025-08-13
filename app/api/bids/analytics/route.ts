import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const AnalyticsQuerySchema = z.object({
  loan_id: z.string().uuid().optional(),
  timeframe: z.enum(['24h', '7d', '30d', 'all']).default('30d').optional(),
  metric: z.enum(['auction_efficiency', 'bidding_patterns', 'lender_activity', 'loan_summary']).optional()
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'unknown'
    const rateLimitResult = await checkRateLimit(`${ip}-bid-analytics`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryData = Object.fromEntries(searchParams.entries())
    const validatedQuery = AnalyticsQuerySchema.parse(queryData)

    const { loan_id, timeframe, metric } = validatedQuery

    // Calculate time filter
    let timeFilter: string | null = null
    if (timeframe !== 'all') {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720 // 30d
      timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    }

    let result: any = {}

    if (!metric || metric === 'auction_efficiency') {
      result.auction_efficiency = await getAuctionEfficiency(loan_id, timeFilter)
    }

    if (!metric || metric === 'bidding_patterns') {
      result.bidding_patterns = await getBiddingPatterns(loan_id, timeFilter)
    }

    if (!metric || metric === 'lender_activity') {
      result.lender_activity = await getLenderActivity(loan_id, timeFilter)
    }

    if (!metric || metric === 'loan_summary') {
      result.loan_summary = await getLoanSummary(loan_id, timeFilter)
    }

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Bid analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    )
  }
}

async function getAuctionEfficiency(loanId?: string, timeFilter?: string | null) {
  let query = supabaseAdmin
    .from('bids')
    .select(`
      loan_id,
      bid_amount,
      status,
      loans!inner (
        id,
        requested_usdc,
        gross_usdc,
        status
      )
    `)

  if (loanId) {
    query = query.eq('loan_id', loanId)
  }

  if (timeFilter) {
    query = query.gte('bid_timestamp', timeFilter)
  }

  const { data: bids, error } = await query

  if (error || !bids) {
    return { error: 'Failed to fetch auction data' }
  }

  // Group by loan and calculate efficiency
  const loanGroups = bids.reduce((acc: any, bid: any) => {
    const loanId = bid.loan_id
    if (!acc[loanId]) {
      acc[loanId] = {
        loan_id: loanId,
        requested: bid.loans.requested_usdc || 0,
        funded: bid.loans.gross_usdc || 0,
        loan_status: bid.loans.status,
        bids: []
      }
    }
    acc[loanId].bids.push(bid)
    return acc
  }, {})

  const efficiencyData = Object.values(loanGroups).map((loan: any) => {
    const totalBids = loan.bids.length
    const activeBids = loan.bids.filter((b: any) => b.status === 'active').length
    const winningBid = loan.bids.find((b: any) => b.status === 'winning')
    
    return {
      loan_id: loan.loan_id,
      requested_amount: loan.requested,
      funded_amount: loan.funded,
      funding_efficiency: loan.funded ? (loan.funded / loan.requested) * 100 : 0,
      total_bids: totalBids,
      active_bids: activeBids,
      winning_bid_amount: winningBid?.bid_amount || null,
      auction_complete: loan.loan_status === 'funded'
    }
  })

  return {
    summary: {
      total_auctions: efficiencyData.length,
      completed_auctions: efficiencyData.filter(a => a.auction_complete).length,
      avg_funding_efficiency: efficiencyData.reduce((sum, a) => sum + a.funding_efficiency, 0) / efficiencyData.length || 0,
      avg_bids_per_auction: efficiencyData.reduce((sum, a) => sum + a.total_bids, 0) / efficiencyData.length || 0
    },
    auctions: efficiencyData
  }
}

async function getBiddingPatterns(loanId?: string, timeFilter?: string | null) {
  let query = supabaseAdmin
    .from('bids')
    .select(`
      bid_amount,
      bid_sequence,
      bid_timestamp,
      bidder_fid,
      status,
      loan_id,
      loans!inner (
        requested_usdc,
        status
      )
    `)
    .order('bid_timestamp', { ascending: true })

  if (loanId) {
    query = query.eq('loan_id', loanId)
  }

  if (timeFilter) {
    query = query.gte('bid_timestamp', timeFilter)
  }

  const { data: bids, error } = await query

  if (error || !bids) {
    return { error: 'Failed to fetch bidding patterns' }
  }

  // Analyze bid timing and amounts
  const hourlyBidding = bids.reduce((acc: any, bid: any) => {
    const hour = new Date(bid.bid_timestamp).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {})

  // Analyze bid amount distribution
  const amountBuckets = bids.reduce((acc: any, bid: any) => {
    const requested = bid.loans?.requested_usdc || 1000
    const percentage = (bid.bid_amount / requested) * 100
    
    let bucket
    if (percentage < 1) bucket = '<1%'
    else if (percentage < 5) bucket = '1-5%'
    else if (percentage < 10) bucket = '5-10%'
    else if (percentage < 25) bucket = '10-25%'
    else if (percentage < 50) bucket = '25-50%'
    else bucket = '50%+'
    
    acc[bucket] = (acc[bucket] || 0) + 1
    return acc
  }, {})

  // Analyze bid sequences (early vs late bids)
  const sequencePatterns = bids.reduce((acc: any, bid: any) => {
    const sequence = bid.bid_sequence || 1
    let phase
    if (sequence <= 2) phase = 'early'
    else if (sequence <= 5) phase = 'middle'
    else phase = 'late'
    
    acc[phase] = (acc[phase] || 0) + 1
    return acc
  }, {})

  return {
    hourly_distribution: hourlyBidding,
    amount_distribution: amountBuckets,
    sequence_patterns: sequencePatterns,
    total_bids: bids.length,
    unique_bidders: new Set(bids.map(b => b.bidder_fid)).size
  }
}

async function getLenderActivity(loanId?: string, timeFilter?: string | null) {
  let query = supabaseAdmin
    .from('bids')
    .select(`
      bidder_fid,
      bid_amount,
      status,
      loan_id,
      bid_timestamp
    `)

  if (loanId) {
    query = query.eq('loan_id', loanId)
  }

  if (timeFilter) {
    query = query.gte('bid_timestamp', timeFilter)
  }

  const { data: bids, error } = await query

  if (error || !bids) {
    return { error: 'Failed to fetch lender activity' }
  }

  // Group by bidder FID
  const lenderStats = bids.reduce((acc: any, bid: any) => {
    const fid = bid.bidder_fid
    if (!acc[fid]) {
      acc[fid] = {
        bidder_fid: fid,
        total_bids: 0,
        active_bids: 0,
        winning_bids: 0,
        total_bid_amount: 0,
        avg_bid_amount: 0,
        loans_participated: new Set(),
        first_bid: null,
        last_bid: null
      }
    }

    const lender = acc[fid]
    lender.total_bids++
    lender.total_bid_amount += bid.bid_amount
    lender.loans_participated.add(bid.loan_id)

    if (bid.status === 'active') lender.active_bids++
    if (bid.status === 'winning') lender.winning_bids++

    if (!lender.first_bid || bid.bid_timestamp < lender.first_bid) {
      lender.first_bid = bid.bid_timestamp
    }
    if (!lender.last_bid || bid.bid_timestamp > lender.last_bid) {
      lender.last_bid = bid.bid_timestamp
    }

    return acc
  }, {})

  // Calculate averages and convert Sets to counts
  const lenderActivity = Object.values(lenderStats).map((lender: any) => ({
    ...lender,
    avg_bid_amount: lender.total_bid_amount / lender.total_bids,
    loans_participated: lender.loans_participated.size,
    win_rate: lender.winning_bids / lender.total_bids * 100
  })).sort((a: any, b: any) => b.total_bids - a.total_bids)

  return {
    top_lenders: lenderActivity.slice(0, 10),
    summary: {
      total_unique_lenders: lenderActivity.length,
      avg_bids_per_lender: lenderActivity.reduce((sum: number, l: any) => sum + l.total_bids, 0) / lenderActivity.length || 0,
      avg_win_rate: lenderActivity.reduce((sum: number, l: any) => sum + l.win_rate, 0) / lenderActivity.length || 0
    }
  }
}

async function getLoanSummary(loanId?: string, timeFilter?: string | null) {
  if (!loanId) {
    return { error: 'loan_id required for loan summary' }
  }

  // Get loan details with all bids
  const { data: loan, error: loanError } = await supabaseAdmin
    .from('loans')
    .select(`
      id,
      borrower_fid,
      lender_fid,
      requested_usdc,
      gross_usdc,
      status,
      created_at,
      updated_at,
      due_ts,
      description
    `)
    .eq('id', loanId)
    .single()

  if (loanError || !loan) {
    return { error: 'Loan not found' }
  }

  let bidQuery = supabaseAdmin
    .from('bids')
    .select('*')
    .eq('loan_id', loanId)
    .order('bid_timestamp', { ascending: true })

  if (timeFilter) {
    bidQuery = bidQuery.gte('bid_timestamp', timeFilter)
  }

  const { data: bids, error: bidsError } = await bidQuery

  if (bidsError) {
    return { error: 'Failed to fetch bid data' }
  }

  const winningBid = bids?.find(b => b.status === 'winning')
  const activeBids = bids?.filter(b => b.status === 'active') || []

  return {
    loan_details: loan,
    auction_stats: {
      total_bids: bids?.length || 0,
      unique_bidders: new Set(bids?.map(b => b.bidder_fid)).size,
      bid_range: bids?.length ? {
        min: Math.min(...bids.map(b => b.bid_amount)),
        max: Math.max(...bids.map(b => b.bid_amount)),
        avg: bids.reduce((sum, b) => sum + b.bid_amount, 0) / bids.length
      } : null,
      winning_bid: winningBid,
      active_bids: activeBids.length,
      funding_efficiency: loan.gross_usdc ? (loan.gross_usdc / loan.requested_usdc) * 100 : 0
    },
    bid_timeline: bids || []
  }
}