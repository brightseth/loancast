import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - you can add bearer token if needed
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer fix-loan-data-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting loan FID fixes...')

    // Fix Henry's loan: Seth (5046) funded Henry's (732) $100 loan
    const { error: henryError } = await supabaseAdmin
      .from('loans')
      .update({
        lender_fid: 5046,
        updated_at: new Date().toISOString()
      })
      .eq('id', '9abed685-639c-44ce-b811-c83e897d94dd')
      .eq('borrower_fid', 732)

    if (henryError) {
      console.error('Error fixing Henry loan:', henryError)
      return NextResponse.json({ 
        error: 'Failed to fix Henry loan',
        details: henryError 
      }, { status: 500 })
    }

    // Fix Seth's loan: Seth (5046) borrowed $789, Henry (732) funded it  
    const { error: sethError } = await supabaseAdmin
      .from('loans')
      .update({
        borrower_fid: 5046,
        lender_fid: 732,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'b6c98b1d-f440-4829-8d35-cdbffad43545')
      .eq('gross_usdc', 789)

    if (sethError) {
      console.error('Error fixing Seth loan:', sethError)
      return NextResponse.json({ error: 'Failed to fix Seth loan' }, { status: 500 })
    }

    // Verify the fixes by fetching updated loans
    const { data: updatedLoans, error: fetchError } = await supabaseAdmin
      .from('loans')
      .select('id, cast_hash, borrower_fid, lender_fid, gross_usdc, repay_usdc, status')
      .in('id', ['9abed685-639c-44ce-b811-c83e897d94dd', 'b6c98b1d-f440-4829-8d35-cdbffad43545'])
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching updated loans:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch updated loans' }, { status: 500 })
    }

    console.log('Loan FID fixes completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Loan FIDs fixed successfully',
      updatedLoans: updatedLoans,
      fixes: [
        {
          loan: 'Henry loan ($100)',
          action: 'Set lender_fid to 5046 (Seth)',
          reason: 'Seth collected Henry cast #0xbde513'
        },
        {
          loan: 'Seth loan ($789)', 
          action: 'Set borrower_fid to 5046 (Seth), lender_fid to 732 (Henry)',
          reason: 'Seth borrowed $789, Henry funded it'
        }
      ]
    })

  } catch (error) {
    console.error('Error in loan FID fix:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}