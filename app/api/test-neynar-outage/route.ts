import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Mock function that simulates Neynar 503 failure
async function createFailingLoanCast() {
  console.log('Simulating Neynar 503 error...')
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  throw new Error('Service temporarily unavailable')
}

export async function POST(request: NextRequest) {
  try {
    const { borrower_fid, amount, yield_bps, days } = await request.json()
    
    // Calculate due date
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + days)
    
    // Calculate repay amount
    const repayAmount = Math.round(amount * (1 + yield_bps / 10000) * 100) / 100
    
    console.log('Testing loan creation with Neynar outage simulation')
    
    // Generate UUID for loan
    const uuid = uuidv4()
    
    // Try cast creation - this will fail
    let cast: { hash: string; success: boolean; error?: string }
    let castSuccess = false
    try {
      await createFailingLoanCast()
      // This won't execute due to the throw
      cast = { hash: `success-${Date.now()}`, success: true }
      castSuccess = true
    } catch (castError) {
      const errorMessage = castError instanceof Error ? castError.message : 'Unknown error'
      console.log('Cast creation failed as expected:', errorMessage)
      
      // Fallback - loan still gets created with failed cast hash
      cast = { 
        hash: `failed-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        success: false,
        error: errorMessage
      }
      castSuccess = false
    }

    // Create loan in database despite cast failure
    const loanData = {
      id: uuid,
      cast_hash: cast.hash,
      borrower_fid,
      yield_bps,
      repay_usdc: repayAmount,
      due_ts: dueDate.toISOString(),
      status: 'open',
      // Store cast failure info in loan record - notes: `Cast failed: ${cast.error}. Can be retried later.`,
    }

    console.log('Inserting loan despite cast failure:', loanData)
    
    const { data: loan, error } = await supabaseAdmin
      .from('loans')
      .insert(loanData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Loan created successfully despite Neynar outage')
    
    return NextResponse.json({
      success: true,
      loan,
      cast_success: castSuccess,
      cast_error: cast.error || null,
      message: castSuccess 
        ? 'Loan created and cast published successfully'
        : 'Loan created successfully but cast failed. Cast can be retried later.',
      retry_cast_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/loans/${loan.id}/retry-cast`
    })
    
  } catch (error) {
    console.error('Test loan creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}