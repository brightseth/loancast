import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Bid parsing regex patterns
const BID_PATTERNS = [
  /bid\s+(\d+(?:\.\d{1,2})?)/i,           // "bid 80" or "bid 80.50"
  /^\$?(\d+(?:\.\d{1,2})?)\s*(?:usdc)?$/i, // "$80" or "80 USDC" or just "80"
  /collect.*\$?(\d+(?:\.\d{1,2})?)/i,      // "collect for $80"
]

interface NeynarEvent {
  type: 'cast.created' | 'reaction.created' | 'action.clicked'
  data: {
    cast?: {
      hash: string
      parent_hash?: string
      text: string
      author: {
        fid: number
        username: string
        display_name: string
      }
      timestamp: string
    }
    reaction?: {
      type: string
      cast: {
        hash: string
      }
      user: {
        fid: number
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const event: NeynarEvent = await req.json()
    console.log('[Neynar Bid Webhook] Event type:', event.type)
    
    // Handle cast replies (bids)
    if (event.type === 'cast.created' && event.data.cast?.parent_hash) {
      const cast = event.data.cast
      
      // Check if this is a reply to a loan cast
      const { data: loan } = await supabase
        .from('loans')
        .select('id, status, gross_usdc')
        .eq('cast_hash', cast.parent_hash)
        .single()
      
      if (!loan || loan.status !== 'seeking') {
        return NextResponse.json({ received: true })
      }
      
      // Parse bid amount from cast text
      let bidAmount: number | null = null
      for (const pattern of BID_PATTERNS) {
        const match = cast.text.match(pattern)
        if (match) {
          bidAmount = parseFloat(match[1])
          break
        }
      }
      
      if (!bidAmount || bidAmount <= 0) {
        console.log('[Neynar Bid Webhook] No valid bid amount found in:', cast.text)
        return NextResponse.json({ received: true })
      }
      
      console.log(`[Neynar Bid Webhook] Bid detected: ${bidAmount} USDC from FID ${cast.author.fid}`)
      
      // Check for existing bid from this user
      const { data: existingBids } = await supabase
        .from('bids')
        .select('id, bid_amount')
        .eq('loan_id', loan.id)
        .eq('bidder_fid', cast.author.fid)
      
      if (existingBids && existingBids.length > 0) {
        // Update existing bid if new amount is higher
        if (bidAmount > existingBids[0].bid_amount) {
          await supabase
            .from('bids')
            .update({
              bid_amount: bidAmount,
              bid_timestamp: cast.timestamp,
              cast_hash: cast.hash,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBids[0].id)
          
          console.log(`[Neynar Bid Webhook] Updated bid to ${bidAmount} for FID ${cast.author.fid}`)
        }
      } else {
        // Get current bid count for sequence
        const { data: allBids } = await supabase
          .from('bids')
          .select('id')
          .eq('loan_id', loan.id)
        
        const bidSequence = (allBids?.length || 0) + 1
        
        // Create new bid
        const bid = {
          id: uuidv4(),
          loan_id: loan.id,
          bidder_fid: cast.author.fid,
          bid_amount: bidAmount,
          bid_timestamp: cast.timestamp,
          bid_sequence: bidSequence,
          cast_hash: cast.hash,
          status: bidSequence === 1 ? 'winning' : 'losing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        await supabase
          .from('bids')
          .insert(bid)
        
        console.log(`[Neynar Bid Webhook] Created bid: ${bidAmount} USDC from FID ${cast.author.fid}`)
      }
      
      // Update bid statuses (mark highest as winning)
      await updateBidStatuses(loan.id)
      
      // TODO: Emit SSE event for real-time UI updates
      // await emitBidUpdate(loan.id)
    }
    
    // Handle collect actions (alternative bid mechanism)
    if (event.type === 'action.clicked') {
      // Parse collect/bid actions if using Farcaster Actions
      // Similar logic to above
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Neynar Bid Webhook] Error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

async function updateBidStatuses(loanId: string) {
  // Get all bids for this loan
  const { data: bids } = await supabase
    .from('bids')
    .select('id, bid_amount')
    .eq('loan_id', loanId)
    .order('bid_amount', { ascending: false })
  
  if (!bids || bids.length === 0) return
  
  // Mark highest bid as winning, others as losing
  for (let i = 0; i < bids.length; i++) {
    const status = i === 0 ? 'winning' : 'losing'
    await supabase
      .from('bids')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bids[i].id)
  }
}