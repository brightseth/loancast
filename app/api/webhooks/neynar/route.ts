import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Verify webhook signature from Neynar
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-neynar-signature')
    const webhookSecret = process.env.NEYNAR_WEBHOOK_SECRET
    
    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }
    
    const data = JSON.parse(body)
    console.log('Webhook received:', data.type)
    
    // Handle different webhook types
    switch (data.type) {
      case 'cast.created':
        // Check if it's a reply to a LoanCast
        if (data.data.parent_hash) {
          await handleCastReply(data.data)
        }
        break
        
      case 'reaction.created':
        // Track likes/recasts on LoanCasts
        await handleReaction(data.data)
        break
        
      case 'cast.deleted':
        // Handle cast deletion - delete associated loan
        await handleCastDeleted(data.data)
        break
        
      default:
        console.log('Unhandled webhook type:', data.type)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCastReply(data: any) {
  try {
    // Check if parent cast is a LoanCast
    const { data: loan } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('cast_hash', data.parent_hash)
      .single()
    
    if (!loan) return
    
    console.log('Reply to LoanCast:', loan.id)
    
    // Check if reply contains bid amount
    const bidMatch = data.text.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:USDC)?/i)
    if (bidMatch) {
      const bidAmount = parseFloat(bidMatch[1].replace(/,/g, ''))
      
      // Store bid in database
      const bid = {
        loan_id: loan.id,
        lender_fid: data.author.fid,
        amount: bidAmount,
        cast_hash: data.hash,
        created_at: new Date(data.timestamp).toISOString()
      }
      
      const { error } = await supabaseAdmin
        .from('bids')
        .insert(bid)
      
      if (error) {
        console.error('Error storing bid:', error)
      } else {
        console.log('Bid stored:', bid)
        
        // Check if this bid meets the loan amount
        if (bidAmount >= loan.amount) {
          // Update loan status to indicate it has a qualifying bid
          await supabaseAdmin
            .from('loans')
            .update({ 
              status: 'funded',
              lender_fid: data.author.fid,
              funded_at: new Date().toISOString()
            })
            .eq('id', loan.id)
        }
      }
    }
  } catch (error) {
    console.error('Error handling cast reply:', error)
  }
}

async function handleReaction(data: any) {
  try {
    // Track engagement on LoanCasts
    const { data: loan } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('cast_hash', data.cast.hash)
      .single()
    
    if (!loan) return
    
    console.log(`${data.reaction_type} on LoanCast:`, loan.id)
    
    // Store reaction data for analytics
    const reaction = {
      loan_id: loan.id,
      user_fid: data.user.fid,
      reaction_type: data.reaction_type, // 'like' or 'recast'
      created_at: new Date(data.timestamp).toISOString()
    }
    
    const { error } = await supabaseAdmin
      .from('reactions')
      .insert(reaction)
    
    if (error) {
      console.error('Error storing reaction:', error)
    }
    
    // Update loan engagement metrics
    const column = data.reaction_type === 'like' ? 'likes_count' : 'recasts_count'
    await supabaseAdmin.rpc(`increment_${column}`, { loan_id: loan.id })
    
  } catch (error) {
    console.error('Error handling reaction:', error)
  }
}

async function handleCastDeleted(data: any) {
  try {
    const castHash = data.hash || data.cast_hash
    
    if (!castHash) {
      console.error('No cast hash provided in delete webhook')
      return
    }
    
    console.log('Processing cast deletion:', castHash)
    
    // Find loan associated with this cast
    const { data: loan, error: fetchError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('cast_hash', castHash)
      .single()
    
    if (fetchError || !loan) {
      console.log('No loan found for deleted cast:', castHash)
      return
    }
    
    console.log(`Cast deleted for loan ${loan.id} (${loan.loan_number}):`, {
      borrower_fid: loan.borrower_fid,
      amount: loan.amount_usdc || loan.gross_usdc || loan.net_usdc,
      status: loan.status
    })
    
    // Only delete unfunded loans to avoid issues with active loans
    if (loan.status === 'open') {
      // Delete associated data first (cascading deletes)
      await supabaseAdmin
        .from('bids')
        .delete()
        .eq('loan_id', loan.id)
      
      await supabaseAdmin
        .from('reactions')
        .delete()
        .eq('loan_id', loan.id)
      
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('loan_id', loan.id)
      
      // Delete the loan
      const { error: deleteError } = await supabaseAdmin
        .from('loans')
        .delete()
        .eq('id', loan.id)
      
      if (deleteError) {
        console.error('Error deleting loan:', deleteError)
      } else {
        console.log(`Successfully deleted loan ${loan.id} due to cast deletion`)
        
        // Create notification for borrower (if they have notifications enabled)
        const notification = {
          user_fid: loan.borrower_fid,
          type: 'loan_deleted',
          title: 'Loan Deleted',
          message: `Your loan request for $${loan.amount_usdc || loan.gross_usdc || loan.net_usdc} was deleted because you removed the cast from Farcaster`,
          metadata: {
            loan_id: loan.id,
            loan_number: loan.loan_number,
            reason: 'cast_deleted'
          },
          created_at: new Date().toISOString()
        }
        
        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert(notification)
        
        if (notificationError) {
          console.error('Error creating deletion notification:', notificationError)
        }
      }
    } else if (loan.status === 'funded') {
      // For funded loans, mark as deleted but don't remove from database
      // This preserves the transaction history
      const { error: updateError } = await supabaseAdmin
        .from('loans')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString(),
          notes: `Cast deleted by borrower on ${new Date().toISOString()}`
        })
        .eq('id', loan.id)
      
      if (updateError) {
        console.error('Error marking funded loan as deleted:', updateError)
      } else {
        console.log(`Marked funded loan ${loan.id} as deleted due to cast deletion`)
        
        // Notify both borrower and lender
        const notifications = [
          {
            user_fid: loan.borrower_fid,
            type: 'loan_cast_deleted',
            title: 'Loan Cast Deleted',
            message: `You deleted the cast for your funded loan of $${loan.repay_usdc}. The loan is still active and must be repaid.`,
            loan_id: loan.id,
            metadata: { loan_number: loan.loan_number },
            created_at: new Date().toISOString()
          }
        ]
        
        if (loan.lender_fid) {
          notifications.push({
            user_fid: loan.lender_fid,
            type: 'loan_cast_deleted',
            title: 'Borrower Deleted Cast',
            message: `The borrower deleted the cast for loan $${loan.repay_usdc}, but the loan is still active.`,
            loan_id: loan.id,
            metadata: { loan_number: loan.loan_number },
            created_at: new Date().toISOString()
          })
        }
        
        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications)
        
        if (notificationError) {
          console.error('Error creating cast deletion notifications:', notificationError)
        }
      }
    }
    
  } catch (error) {
    console.error('Error handling cast deletion:', error)
  }
}

// Endpoint to manually sync loan data from Farcaster
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const loanId = searchParams.get('loan_id')
    
    if (!loanId) {
      return NextResponse.json(
        { error: 'loan_id parameter required' },
        { status: 400 }
      )
    }
    
    // Get loan from database
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
    
    // Fetch cast data from Neynar
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/cast?identifier=${loan.cast_hash}&type=hash`,
      {
        headers: {
          'api_key': process.env.NEYNAR_API_KEY!
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch cast data')
    }
    
    const { cast } = await response.json()
    
    // Update loan with latest engagement metrics
    const updates = {
      likes_count: cast.reactions.likes_count || 0,
      recasts_count: cast.reactions.recasts_count || 0,
      replies_count: cast.replies.count || 0,
      last_synced_at: new Date().toISOString()
    }
    
    await supabaseAdmin
      .from('loans')
      .update(updates)
      .eq('id', loanId)
    
    // Fetch and store replies (potential bids)
    const repliesResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/cast/conversation?identifier=${loan.cast_hash}&type=hash&reply_depth=1&limit=50`,
      {
        headers: {
          'api_key': process.env.NEYNAR_API_KEY!
        }
      }
    )
    
    if (repliesResponse.ok) {
      const repliesData = await repliesResponse.json()
      const replies = repliesData.conversation.cast.direct_replies || []
      
      for (const reply of replies) {
        await handleCastReply(reply)
      }
    }
    
    return NextResponse.json({
      loan_id: loanId,
      updated: updates,
      synced_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error syncing loan data:', error)
    return NextResponse.json(
      { error: 'Failed to sync loan data' },
      { status: 500 }
    )
  }
}