import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createFundingCast, getUserByFid } from '@/lib/neynar'
import { notificationService } from '@/lib/notifications'
import { canFundLoans } from '@/lib/feature-flags'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check kill switch first
    const fundingCheck = canFundLoans()
    if (!fundingCheck.allowed) {
      return NextResponse.json(
        { error: fundingCheck.reason },
        { status: 503 }
      )
    }

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

    // Prevent borrowers from funding their own loans
    if (loan.borrower_fid === lenderFid) {
      return NextResponse.json(
        { error: 'Borrowers cannot fund their own loans' },
        { status: 403 }
      )
    }

    // Validate exact funding amount
    const targetAmount = loan.repay_usdc || 0
    const currentFunding = loan.gross_usdc || 0
    const remainingAmount = targetAmount - currentFunding

    // Check for exact amount or underpayment/overpayment
    if (Math.abs(amount - remainingAmount) > 0.01) {
      if (amount < remainingAmount - 0.01) {
        return NextResponse.json(
          { 
            error: `Insufficient funding: sent $${amount.toFixed(2)}, required $${remainingAmount.toFixed(2)}. Please send exactly $${remainingAmount.toFixed(2)}.`,
            required_amount: remainingAmount,
            sent_amount: amount
          },
          { status: 400 }
        )
      } else if (amount > remainingAmount + 0.01) {
        // Overpayment - accept but ignore excess
        console.warn(`Overpayment detected: sent $${amount.toFixed(2)}, required $${remainingAmount.toFixed(2)}. Excess will be accepted but may not be recoverable.`)
      }
    }

    const newFunding = currentFunding + Math.min(amount, remainingAmount) // Cap at required amount
    const fullyFunded = newFunding >= targetAmount
    
    // ATOMIC UPDATE: Only update if loan is still 'open' to prevent race conditions
    const { data: updatedLoan, error: updateError } = await supabase
      .from('loans')
      .update({
        gross_usdc: newFunding,
        lender_fid: fullyFunded ? lenderFid : loan.lender_fid,
        status: fullyFunded ? 'funded' : 'open',
        tx_fund: txHash || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('status', 'open')  // CRITICAL: Only update if still open
      .select()
      .single()

    if (updateError || !updatedLoan) {
      // If update failed, loan was likely already funded by another transaction
      if (updateError?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Loan already funded by another lender' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to update loan - already funded or does not exist' },
        { status: 409 }
      )
    }

    // If loan is fully funded, create a funding cast and send notifications
    if (fullyFunded) {
      try {
        // Get lender and borrower names for the cast
        const [lenderData, borrowerData] = await Promise.all([
          getUserByFid(lenderFid),
          getUserByFid(loan.borrower_fid)
        ])
        
        const lenderName = (lenderData as any)?.display_name || (lenderData as any)?.username || `FID ${lenderFid}`
        const borrowerName = (borrowerData as any)?.display_name || (borrowerData as any)?.username || `FID ${loan.borrower_fid}`
        const loanId = `LOANCAST-${loan.loan_number.toString().padStart(4, '0')}`
        
        // Send notification to borrower
        await notificationService.notifyLoanFunded(
          loan.borrower_fid,
          params.id,
          lenderName,
          amount,
          signerUuid,
          loan.cast_hash
        )
        
        // Create funding cast if we have the necessary data
        if (loan.cast_hash && signerUuid) {
          console.log(`Creating funding cast for ${loanId}`)
          await createFundingCast(
            signerUuid,
            loanId,
            loan.cast_hash,
            lenderName,
            borrowerName,
            amount
          )
        }
      } catch (error) {
        console.error('Failed to create funding cast or notification:', error)
        // Don't fail the funding if cast creation or notification fails
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