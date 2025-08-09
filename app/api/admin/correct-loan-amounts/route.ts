import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loanId, actualLoanAmount, actualRepayAmount } = body
    
    console.log('Correcting loan amounts:', { 
      loanId, 
      actualLoanAmount, 
      actualRepayAmount 
    })
    
    // First check if loan exists and get current data
    const { data: currentLoan, error: fetchError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single()
    
    if (fetchError || !currentLoan) {
      console.error('Loan not found:', loanId, fetchError)
      return NextResponse.json(
        { error: 'Loan not found', details: fetchError?.message },
        { status: 404 }
      )
    }
    
    // Update the loan with correct amounts
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        gross_usdc: actualLoanAmount,  // The bid amount
        net_usdc: actualLoanAmount * 0.9, // After 10% platform fee
        repay_usdc: actualRepayAmount, // Principal + 2%
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update loan amounts', details: updateError.message },
        { status: 500 }
      )
    }
    
    console.log('Loan amounts corrected:', updated)
    
    // Update notifications to reflect correct amounts
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_fid: updated.borrower_fid,
        type: 'loan_correction',
        title: 'Loan amounts corrected',
        message: `Your loan has been updated: You received $${actualLoanAmount * 0.9} and will repay $${actualRepayAmount} on ${new Date(updated.due_ts).toLocaleDateString()}`,
        loan_id: loanId,
        created_at: new Date().toISOString()
      })
    
    return NextResponse.json({
      success: true,
      message: 'Loan amounts corrected',
      loan: {
        id: loanId,
        loan_amount: actualLoanAmount,
        net_to_borrower: actualLoanAmount * 0.9,
        repayment_amount: actualRepayAmount,
        interest: actualRepayAmount - actualLoanAmount
      }
    })
    
  } catch (error) {
    console.error('Correction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}