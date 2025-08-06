import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('Starting loan sync cron job...')
    
    // Get active loans that need syncing (created in last 24 hours or not synced recently)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: loans, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('status', 'open')
      .or(`created_at.gte.${twentyFourHoursAgo},last_synced_at.lt.${oneHourAgo},last_synced_at.is.null`)
      .limit(50)
    
    if (error) {
      console.error('Error fetching loans:', error)
      return NextResponse.json(
        { error: 'Failed to fetch loans' },
        { status: 500 }
      )
    }
    
    console.log(`Found ${loans.length} loans to sync`)
    
    const results = []
    
    for (const loan of loans) {
      try {
        // Fetch cast data from Neynar
        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/cast?identifier=${loan.cast_hash}&type=hash`,
          {
            headers: {
              'api_key': NEYNAR_API_KEY
            }
          }
        )
        
        if (!response.ok) {
          console.error(`Failed to fetch cast for loan ${loan.id}`)
          continue
        }
        
        const { cast } = await response.json()
        
        // Update engagement metrics
        await supabaseAdmin
          .from('loans')
          .update({
            likes_count: cast.reactions.likes_count || 0,
            recasts_count: cast.reactions.recasts_count || 0,
            replies_count: cast.replies.count || 0,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', loan.id)
        
        // Fetch replies to check for bids
        const repliesResponse = await fetch(
          `https://api.neynar.com/v2/farcaster/cast/conversation?identifier=${loan.cast_hash}&type=hash&reply_depth=1&limit=50`,
          {
            headers: {
              'api_key': NEYNAR_API_KEY
            }
          }
        )
        
        if (repliesResponse.ok) {
          const repliesData = await repliesResponse.json()
          const replies = repliesData.conversation.cast.direct_replies || []
          
          for (const reply of replies) {
            // Check if reply contains a bid
            const bidMatch = reply.text.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:USDC)?/i)
            if (bidMatch) {
              const bidAmount = parseFloat(bidMatch[1].replace(/,/g, ''))
              
              // Check if bid already exists
              const { data: existingBid } = await supabaseAdmin
                .from('bids')
                .select('id')
                .eq('loan_id', loan.id)
                .eq('cast_hash', reply.hash)
                .single()
              
              if (!existingBid) {
                // Store new bid
                await supabaseAdmin
                  .from('bids')
                  .insert({
                    loan_id: loan.id,
                    lender_fid: reply.author.fid,
                    amount: bidAmount,
                    cast_hash: reply.hash,
                    created_at: new Date(reply.timestamp).toISOString()
                  })
                
                console.log(`New bid found: $${bidAmount} for loan ${loan.id}`)
                
                // Check if auction period has ended (24 hours)
                const auctionEnd = new Date(loan.created_at)
                auctionEnd.setHours(auctionEnd.getHours() + 24)
                
                if (new Date() > auctionEnd) {
                  // Get highest bid
                  const { data: highestBid } = await supabaseAdmin
                    .from('bids')
                    .select('*')
                    .eq('loan_id', loan.id)
                    .eq('status', 'active')
                    .order('amount', { ascending: false })
                    .limit(1)
                    .single()
                  
                  if (highestBid && highestBid.amount >= loan.amount) {
                    // Mark loan as funded
                    await supabaseAdmin
                      .from('loans')
                      .update({
                        status: 'funded',
                        lender_fid: highestBid.lender_fid,
                        funded_at: new Date().toISOString()
                      })
                      .eq('id', loan.id)
                    
                    // Accept the winning bid
                    await supabaseAdmin
                      .from('bids')
                      .update({ status: 'accepted' })
                      .eq('id', highestBid.id)
                    
                    // Reject other bids
                    await supabaseAdmin
                      .from('bids')
                      .update({ status: 'rejected' })
                      .eq('loan_id', loan.id)
                      .neq('id', highestBid.id)
                    
                    console.log(`Loan ${loan.id} funded by FID ${highestBid.lender_fid}`)
                  }
                }
              }
            }
          }
        }
        
        results.push({
          loan_id: loan.id,
          synced: true,
          engagement: {
            likes: cast.reactions.likes_count || 0,
            recasts: cast.reactions.recasts_count || 0,
            replies: cast.replies.count || 0
          }
        })
        
      } catch (error) {
        console.error(`Error syncing loan ${loan.id}:`, error)
        results.push({
          loan_id: loan.id,
          synced: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log('Loan sync completed')
    
    return NextResponse.json({
      success: true,
      synced: results.filter(r => r.synced).length,
      failed: results.filter(r => !r.synced).length,
      results
    })
    
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}