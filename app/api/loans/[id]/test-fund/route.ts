import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For testing purposes - mark loan as funded
    const { error } = await supabase
      .from('loans')
      .update({
        status: 'funded',
        lender_fid: 5046, // Your FID for testing
        funded_at: new Date().toISOString(),
        gross_usdc: 100 // Test amount
      })
      .eq('id', params.id)
      .eq('status', 'open') // Only fund open loans

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fund loan' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Loan marked as funded for testing' 
    })
  } catch (error) {
    console.error('Error funding loan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}