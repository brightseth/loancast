import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Transform database bid to client format
function transformBid(dbBid: any) {
  return {
    id: dbBid.id,
    amount: Number(dbBid.bid_amount),
    bidderFid: dbBid.bidder_fid,
    bidderHandle: undefined, // Could fetch from Farcaster API
    txHash: dbBid.tx_hash || undefined,
    createdAt: dbBid.bid_timestamp || dbBid.created_at
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const loanId = params.id
  
  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let lastBidCount = 0
      let lastBidId: string | null = null
      
      // Send initial snapshot
      const { data: initialBids } = await supabase
        .from('bids')
        .select('*')
        .eq('loan_id', loanId)
        .order('bid_amount', { ascending: false })
      
      const transformedBids = (initialBids || []).map(transformBid)
      lastBidCount = transformedBids.length
      lastBidId = transformedBids[0]?.id || null
      
      // Send snapshot event
      const snapshotEvent = `event: message\ndata: ${JSON.stringify({ 
        type: 'snapshot',
        bids: transformedBids
      })}\n\n`
      
      controller.enqueue(encoder.encode(snapshotEvent))
      
      // Send retry hint for auto-reconnect backoff
      controller.enqueue(encoder.encode('retry: 10000\n\n'))
      
      // Set up heartbeat (every 20 seconds) - using SSE comment format for max compatibility
      const heartbeatInterval = setInterval(() => {
        try {
          // SSE comment format for heartbeat (starts with colon)
          const heartbeat = `: heartbeat ${new Date().toISOString()}\n\n`
          controller.enqueue(encoder.encode(heartbeat))
        } catch (error) {
          // Stream might be closed
          clearInterval(heartbeatInterval)
        }
      }, 20000)
      
      // Poll for new bids (every 3 seconds)
      const pollInterval = setInterval(async () => {
        try {
          const { data: currentBids } = await supabase
            .from('bids')
            .select('*')
            .eq('loan_id', loanId)
            .order('bid_amount', { ascending: false })
          
          if (!currentBids) return
          
          // Check for new bids
          if (currentBids.length > lastBidCount) {
            // Find the new bid(s)
            const newBids = currentBids.filter(bid => 
              !lastBidId || new Date(bid.created_at) > new Date()
            )
            
            // Send append events for each new bid
            for (const newBid of newBids) {
              const appendEvent = `event: message\ndata: ${JSON.stringify({
                type: 'append',
                bid: transformBid(newBid)
              })}\n\n`
              
              controller.enqueue(encoder.encode(appendEvent))
            }
            
            lastBidCount = currentBids.length
            lastBidId = currentBids[0]?.id || lastBidId
          }
          
          // Also check for bid updates (amount changes)
          const topBid = currentBids[0]
          if (topBid && topBid.id !== lastBidId && topBid.bid_amount !== currentBids.find(b => b.id === lastBidId)?.bid_amount) {
            // Top bid changed, send full snapshot to ensure consistency
            const updateEvent = `event: message\ndata: ${JSON.stringify({
              type: 'snapshot',
              bids: currentBids.map(transformBid)
            })}\n\n`
            
            controller.enqueue(encoder.encode(updateEvent))
            lastBidId = topBid.id
          }
        } catch (error) {
          console.error('[SSE] Error polling bids:', error)
        }
      }, 3000)
      
      // Clean up on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        clearInterval(pollInterval)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}