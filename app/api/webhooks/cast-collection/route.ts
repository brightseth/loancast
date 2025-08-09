import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Handle cast collection events (when someone collects a loan cast as NFT)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Cast collection webhook received:', body)
    
    // Extract relevant data from collection event
    const {
      castHash,
      collectorFid,
      collectionAmount,
      transactionHash,
      timestamp
    } = body
    
    if (!castHash || !collectorFid || !collectionAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Find loan associated with this cast
    const { data: loan, error: fetchError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('cast_hash', castHash)
      .single()
    
    if (fetchError || !loan) {
      console.log('No loan found for collected cast:', castHash)
      return NextResponse.json(
        { error: 'Loan not found for this cast' },
        { status: 404 }
      )
    }
    
    // Check if loan is already funded
    if (loan.status !== 'open') {
      console.log('Loan already funded or closed:', loan.id)
      return NextResponse.json(
        { message: 'Loan is not open for funding' },
        { status: 200 }
      )
    }
    
    // Mark loan as funded via collection
    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        status: 'funded',
        lender_fid: collectorFid,
        funded_at: new Date(timestamp || Date.now()).toISOString(),
        funding_tx_hash: transactionHash,
        funding_method: 'cast_collection',
        collection_amount_usd: collectionAmount,
        notes: `Funded via cast collection for $${collectionAmount}`
      })
      .eq('id', loan.id)
    
    if (updateError) {
      console.error('Error updating loan status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update loan status' },
        { status: 500 }
      )
    }
    
    // Create notifications for borrower and lender
    const notifications = [
      {
        user_fid: loan.borrower_fid,
        type: 'loan_funded',
        title: 'Your loan has been funded!',
        message: `Your loan cast was collected for $${collectionAmount}. The funds should arrive in your wallet soon.`,
        loan_id: loan.id,
        metadata: {
          loan_number: loan.loan_number,
          collection_amount: collectionAmount,
          collector_fid: collectorFid
        },
        created_at: new Date().toISOString()
      },
      {
        user_fid: collectorFid,
        type: 'loan_funded',
        title: 'You funded a loan via collection',
        message: `You collected a loan cast for $${collectionAmount}. Loan ${loan.loan_number} is now active.`,
        loan_id: loan.id,
        metadata: {
          loan_number: loan.loan_number,
          repay_amount: loan.repay_usdc,
          due_date: loan.due_date
        },
        created_at: new Date().toISOString()
      }
    ]
    
    await supabaseAdmin
      .from('notifications')
      .insert(notifications)
    
    console.log(`Loan ${loan.id} funded via cast collection for $${collectionAmount}`)
    
    return NextResponse.json({
      success: true,
      loan_id: loan.id,
      status: 'funded',
      collection_amount: collectionAmount
    })
    
  } catch (error) {
    console.error('Error processing cast collection:', error)
    return NextResponse.json(
      { error: 'Failed to process collection' },
      { status: 500 }
    )
  }
}

// Manual endpoint to mark a loan as funded via collection
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { loanId, collectorFid, collectionAmount } = body
    
    if (!loanId || !collectorFid || !collectionAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: loanId, collectorFid, collectionAmount' },
        { status: 400 }
      )
    }
    
    // Get loan details
    const { data: loan, error: fetchError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single()
    
    if (fetchError || !loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }
    
    // Update loan status
    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        status: 'funded',
        lender_fid: collectorFid,
        funded_at: new Date().toISOString(),
        funding_method: 'cast_collection',
        collection_amount_usd: collectionAmount,
        notes: `Manually marked as funded via cast collection for $${collectionAmount}`
      })
      .eq('id', loanId)
    
    if (updateError) {
      console.error('Error updating loan:', updateError)
      return NextResponse.json(
        { error: 'Failed to update loan' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Loan ${loan.loan_number} marked as funded via collection`
    })
    
  } catch (error) {
    console.error('Error in manual funding:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}