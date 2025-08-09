import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loanId, collectorFid, collectionAmount } = body
    
    console.log('Manual funding request:', { loanId, collectorFid, collectionAmount })
    
    // First, get the current loan to verify it exists
    const { data: loan, error: fetchError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single()
    
    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Loan not found', details: fetchError.message },
        { status: 404 }
      )
    }
    
    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }
    
    console.log('Found loan:', {
      id: loan.id,
      status: loan.status,
      borrower_fid: loan.borrower_fid,
      repay_usdc: loan.repay_usdc
    })
    
    // Update the loan to funded status
    // Use simpler update without new fields first
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        status: 'funded',
        lender_fid: collectorFid,
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update loan', details: updateError.message },
        { status: 500 }
      )
    }
    
    console.log('Loan updated successfully:', updated)
    
    // Create notifications
    const notifications = [
      {
        user_fid: loan.borrower_fid,
        type: 'loan_funded',
        title: 'Your loan has been funded!',
        message: `Your loan was collected for $${collectionAmount}. Repayment of ${loan.repay_usdc} USDC is due on ${new Date(loan.due_ts).toLocaleDateString()}.`,
        loan_id: loan.id,
        created_at: new Date().toISOString()
      },
      {
        user_fid: collectorFid,
        type: 'loan_funded',
        title: 'You funded a loan',
        message: `You collected a loan for $${collectionAmount}. You will receive ${loan.repay_usdc} USDC on ${new Date(loan.due_ts).toLocaleDateString()}.`,
        loan_id: loan.id,
        created_at: new Date().toISOString()
      }
    ]
    
    await supabaseAdmin
      .from('notifications')
      .insert(notifications)
    
    return NextResponse.json({
      success: true,
      message: `Loan ${loan.id} marked as funded`,
      loan: {
        id: loan.id,
        status: 'funded',
        borrower_fid: loan.borrower_fid,
        lender_fid: collectorFid,
        collection_amount: collectionAmount,
        repay_amount: loan.repay_usdc,
        due_date: loan.due_ts
      }
    })
    
  } catch (error) {
    console.error('Manual funding error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}