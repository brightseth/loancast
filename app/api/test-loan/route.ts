import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { addDays } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

export async function POST() {
  try {
    console.log('=== TEST LOAN CREATION ===')
    
    // Test data
    const testData = {
      amount: 100,
      duration_months: 1,
      borrower_fid: 12345
    }

    const monthlyRate = 0.02
    const yield_bps = 2400
    const totalInterest = testData.amount * monthlyRate * testData.duration_months
    const repayAmount = testData.amount + totalInterest
    const dueDate = addDays(new Date(), testData.duration_months * 30)

    const loanData = {
      id: uuidv4(),
      cast_hash: `test-${Date.now()}`,
      borrower_fid: testData.borrower_fid,
      yield_bps,
      repay_usdc: repayAmount,
      due_ts: dueDate.toISOString(),
      status: 'open',
    }

    console.log('Test loan data:', JSON.stringify(loanData, null, 2))
    
    const { data: loan, error } = await supabaseAdmin
      .from('loans')
      .insert(loanData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: error.message,
          code: error.code,
          hint: error.hint 
        },
        { status: 500 }
      )
    }

    console.log('Test loan created successfully:', loan)
    return NextResponse.json({ success: true, loan })
  } catch (error) {
    console.error('Test loan error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}