import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Update the genesis loan with proper amounts
    const { data, error } = await supabaseAdmin
      .from('loans')
      .update({
        gross_usdc: 789,
        net_usdc: 710.1,
        tx_fund: '0x019650f986916936dae462ccef30d5a8b9b41d3d6e2212dc088b622db44a06e5'
      })
      .eq('cast_hash', '0xaab8ad5d')
      .select()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update genesis loan', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Genesis loan updated with proper amounts',
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