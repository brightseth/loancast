import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createFundingCast, getUserByFid } from '@/lib/neynar'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { amount, lenderFid, txHash, signerUuid } = await request.json()

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

    const fullyFunded = newFunding >= targetAmount
    
    // Update the loan with new funding amount
    const { error: updateError } = await supabase
      .from('loans')
      .update({
        gross_usdc: newFunding,
        lender_fid: fullyFunded ? lenderFid : loan.lender_fid,
        status: fullyFunded ? 'funded' : 'open'
      })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update loan' },
        { status: 500 }
      )
    }

    // If loan is fully funded, create a funding cast
    if (fullyFunded && loan.cast_hash && signerUuid) {
      try {
        // Get lender and borrower names for the cast
        const [lenderData, borrowerData] = await Promise.all([
          getUserByFid(lenderFid),
          getUserByFid(loan.borrower_fid)
        ])
        
        const lenderName = (lenderData as any)?.display_name || (lenderData as any)?.username || `FID ${lenderFid}`
        const borrowerName = (borrowerData as any)?.display_name || (borrowerData as any)?.username || `FID ${loan.borrower_fid}`
        const loanId = `LOANCAST-${loan.loan_number.toString().padStart(4, '0')}`
        
        console.log(`Creating funding cast for ${loanId}`)
        await createFundingCast(
          signerUuid,
          loanId,
          loan.cast_hash,
          lenderName,
          borrowerName,
          amount
        )
      } catch (castError) {
        console.error('Failed to create funding cast:', castError)
        // Don't fail the funding if cast creation fails
      }
    }

    return NextResponse.json({
      success: true,
      newFunding,
      fullyFunded,
      loanId: `LOANCAST-${loan.loan_number.toString().padStart(4, '0')}`
    })

  } catch (error) {
    console.error('Error funding loan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}