import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const repayAmount = searchParams.get('repay_amount')
    const dueDate = searchParams.get('due_date')
    
    // Find Henry's loan: 1020 USDC repayment, due Sep 7, 2025
    const query = supabaseAdmin
      .from('loans')
      .select('*')
      .eq('status', 'open')
    
    if (repayAmount) {
      query.eq('repay_usdc', parseFloat(repayAmount))
    }
    
    const { data: loans, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Filter for loans due around Sep 7, 2025
    const targetLoans = loans?.filter(loan => {
      const repayMatches = !repayAmount || loan.repay_usdc == parseFloat(repayAmount)
      const dueSep2025 = loan.due_date && loan.due_date.includes('2025-09')
      return repayMatches && dueSep2025
    })
    
    return NextResponse.json({
      found: targetLoans?.length || 0,
      loans: targetLoans?.map(loan => ({
        id: loan.id,
        loan_number: loan.loan_number,
        borrower_fid: loan.borrower_fid,
        amount: loan.gross_usdc || loan.amount_usdc,
        repay: loan.repay_usdc,
        due_date: loan.due_date,
        status: loan.status,
        cast_hash: loan.cast_hash,
        created_at: loan.created_at
      }))
    })
  } catch (error) {
    console.error('Error finding loan:', error)
    return NextResponse.json(
      { error: 'Failed to find loan' },
      { status: 500 }
    )
  }
}