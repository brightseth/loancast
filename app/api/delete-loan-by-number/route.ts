import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { loanNumber } = await request.json()
    
    if (!loanNumber) {
      return NextResponse.json(
        { error: 'Loan number required' },
        { status: 400 }
      )
    }
    
    // Find and delete loan by loan number
    const { data: loan, error: findError } = await supabaseAdmin
      .from('loans')
      .select('id, loan_number')
      .eq('loan_number', loanNumber)
      .single()
    
    if (findError || !loan) {
      return NextResponse.json(
        { error: `Loan with number ${loanNumber} not found` },
        { status: 404 }
      )
    }
    
    const { error: deleteError } = await supabaseAdmin
      .from('loans')
      .delete()
      .eq('id', loan.id)
    
    if (deleteError) {
      console.error('Error deleting loan:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete loan', details: deleteError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Loan LOANCAST-${loanNumber.toString().padStart(4, '0')} deleted successfully`,
      loanId: loan.id
    })
    
  } catch (error) {
    console.error('Delete loan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}