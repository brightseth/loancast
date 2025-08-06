import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Genesis loan details based on the actual funded cast and transaction
    const castHash = '0xaab8ad5d'
    const grossAmount = 789 // Actual funded amount (78.9 fee + 710.1 to borrower)
    const netAmount = 710.1 // What you received (from BaseScan)
    const repayAmount = 804.78 // Actual repay amount with 2% yield
    const yieldBps = 200 // 2% in basis points
    const farcasterFee = 78.9 // Fee paid to Farcaster (from BaseScan)
    
    // Due date: Sep 2, 2025
    const dueDate = new Date('2025-09-02T00:00:00Z')
    
    // Transaction was on Aug 3, 2025 at 10:07:03 PM UTC (from BaseScan)
    const fundedDate = new Date('2025-08-03T22:07:03Z')
    
    // Loan was probably created a bit before funding
    const createdDate = new Date(fundedDate)
    createdDate.setHours(createdDate.getHours() - 2) // 2 hours before funding
    
    // Transaction details from BaseScan
    const txHash = '0x019650f986916936dae462ccef30d5a8b9b41d3d6e2212dc088b622db44a06e5'
    
    // Henry's actual FID
    const henryFid = 732 // @henry's FID
    
    const loanData = {
      id: uuidv4(),
      loan_number: 1, // LOANCAST-001
      cast_hash: castHash,
      borrower_fid: 5046, // Your FID
      lender_fid: henryFid, // @henry's FID (placeholder)
      gross_usdc: grossAmount,
      net_usdc: netAmount,
      yield_bps: yieldBps,
      repay_usdc: repayAmount,
      start_ts: fundedDate.toISOString(), // When it was funded
      due_ts: dueDate.toISOString(),
      status: 'funded', // It's been funded!
      tx_fund: txHash, // BaseScan transaction hash
      tx_repay: null,
      funded_at: fundedDate.toISOString(),
      created_at: createdDate.toISOString(),
      updated_at: fundedDate.toISOString()
    }

    console.log('Adding genesis loan:', loanData)
    
    const { data, error } = await supabaseAdmin
      .from('loans')
      .upsert(loanData, { onConflict: 'loan_number' })
      .select()
      .single()
    
    if (error) {
      console.error('Error adding genesis loan:', error)
      return NextResponse.json(
        { error: 'Failed to add genesis loan', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Genesis LOANCAST-001 added successfully',
      loan: data
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}