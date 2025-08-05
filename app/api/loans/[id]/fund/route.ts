import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { amount, lenderFid, txHash } = await request.json()

    // Validate input
    if (!amount || !lenderFid) {
      return NextResponse.json(
        { error: 'Amount and lender FID required' },
        { status: 400 }
      )
    }

    // Get the loan
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', params.id)
      .single()

    if (loanError || !loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    if (loan.status !== 'open') {
      return NextResponse.json(
        { error: 'Loan is not open for funding' },
        { status: 400 }
      )
    }

    // For now, simulate funding by updating loan with partial funding
    // In production, this would verify the blockchain transaction first
    const currentFunding = loan.gross_usdc || 0
    const newFunding = currentFunding + amount
    const targetAmount = loan.repay_usdc || 0

    // Update the loan with new funding amount
    const { error: updateError } = await supabase
      .from('loans')
      .update({
        gross_usdc: newFunding,
        lender_fid: newFunding >= targetAmount ? lenderFid : loan.lender_fid
      })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update loan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      newFunding,
      fullyFunded: newFunding >= targetAmount
    })

  } catch (error) {
    console.error('Error funding loan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}