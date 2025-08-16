import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const loanId = params.id
  
  try {
    // Fetch bids from database
    const { data: bids, error } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loanId)
      .order('bid_amount', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Transform to client format
    const transformedBids = (bids || []).map(bid => ({
      id: bid.id,
      amount: Number(bid.bid_amount),
      bidderFid: bid.bidder_fid,
      bidderHandle: undefined, // Could fetch from Farcaster API
      txHash: bid.tx_hash || undefined,
      createdAt: bid.bid_timestamp || bid.created_at
    }))
    
    return NextResponse.json(transformedBids)
  } catch (error) {
    console.error('[Bids API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
  }
}