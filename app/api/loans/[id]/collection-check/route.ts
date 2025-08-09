import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Check if a cast has been collected and update loan accordingly
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = params.id
    
    // Get loan details
    const { data: loan, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single()
    
    if (error || !loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }
    
    // If already funded, return current status
    if (loan.status !== 'open') {
      return NextResponse.json({
        status: loan.status,
        funded: true,
        funding_method: loan.funding_method || 'direct',
        collection_amount: loan.collection_amount_usd || loan.gross_usdc,
        message: 'Loan already funded'
      })
    }
    
    // Check Farcaster for collection events
    // This would integrate with Farcaster API in production
    try {
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/cast?identifier=${loan.cast_hash}&type=hash`,
        {
          headers: {
            'api_key': process.env.NEYNAR_API_KEY!
          }
        }
      )
      
      if (response.ok) {
        const { cast } = await response.json()
        
        // Check if cast has been collected
        // This is where we'd check for collection events
        // For now, we'll check replies for collection indicators
        
        if (cast.replies?.count > 0) {
          // Fetch replies to check for collection confirmations
          const repliesResponse = await fetch(
            `https://api.neynar.com/v2/farcaster/cast/conversation?identifier=${loan.cast_hash}&type=hash&reply_depth=1&limit=10`,
            {
              headers: {
                'api_key': process.env.NEYNAR_API_KEY!
              }
            }
          )
          
          if (repliesResponse.ok) {
            const repliesData = await repliesResponse.json()
            const replies = repliesData.conversation?.cast?.direct_replies || []
            
            // Look for collection indicators in replies
            for (const reply of replies) {
              if (reply.text.toLowerCase().includes('collected') || 
                  reply.text.includes('$')) {
                // Found potential collection
                const amountMatch = reply.text.match(/\$(\d+(?:\.\d+)?)/);
                if (amountMatch) {
                  const amount = parseFloat(amountMatch[1])
                  
                  return NextResponse.json({
                    status: 'open',
                    funded: false,
                    potential_collection: {
                      amount,
                      collector_fid: reply.author.fid,
                      collector_name: reply.author.display_name,
                      reply_hash: reply.hash,
                      message: `Potential collection of $${amount} detected`
                    }
                  })
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking Farcaster:', error)
    }
    
    return NextResponse.json({
      status: 'open',
      funded: false,
      message: 'No collection detected yet',
      cast_hash: loan.cast_hash,
      check_url: `https://warpcast.com/~/conversations/${loan.cast_hash}`
    })
    
  } catch (error) {
    console.error('Collection check error:', error)
    return NextResponse.json(
      { error: 'Failed to check collection status' },
      { status: 500 }
    )
  }
}