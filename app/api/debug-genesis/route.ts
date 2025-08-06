import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // First, let's see what's in the loans table
    const { data: loans, error: loansError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .limit(5)
    
    // Check if we can access the table structure
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'loans' })
      .select()
    
    return NextResponse.json({
      loans: { data: loans, error: loansError?.message },
      columns: { data: columns, error: columnsError?.message },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try a simple insert with minimal data
    const simpleData = {
      loan_number: 1,
      cast_hash: '0xaab8ad5d',
      borrower_fid: 5046,
      lender_fid: 732,
      yield_bps: 200,
      repay_usdc: 804.78,
      due_ts: new Date('2025-09-02').toISOString(),
      status: 'funded',
      created_at: new Date().toISOString()
    }
    
    console.log('Attempting to insert:', simpleData)
    
    const { data, error } = await supabaseAdmin
      .from('loans')
      .insert(simpleData)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        error: 'Insert failed',
        details: error.message,
        code: error.code,
        hint: error.hint
      })
    }
    
    return NextResponse.json({
      success: true,
      loan: data
    })
    
  } catch (error) {
    console.error('Catch error:', error)
    return NextResponse.json({
      error: 'Catch error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}