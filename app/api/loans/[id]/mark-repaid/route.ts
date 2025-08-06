import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/lib/notifications'
import { getUserByFid } from '@/lib/neynar'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    const { tx_hash } = await request.json()

    if (!tx_hash) {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      )
    }

    // Get the loan details
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

    if (loan.status !== 'funded') {
      return NextResponse.json(
        { error: 'Loan is not in funded status' },
        { status: 400 }
      )
    }

    // Check if loan is already repaid
    if (loan.status === 'repaid') {
      return NextResponse.json(
        { error: 'Loan has already been marked as repaid' },
        { status: 400 }
      )
    }

    // Calculate if repayment is on time
    const dueDate = new Date(loan.due_ts)
    const repaidAt = new Date()
    const isOnTime = repaidAt <= dueDate

    // Update loan status to repaid
    const { error: updateError } = await supabase
      .from('loans')
      .update({
        status: 'repaid',
        repaid_at: repaidAt.toISOString(),
        repayment_tx_hash: tx_hash,
        repaid_on_time: isOnTime
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error updating loan:', updateError)
      return NextResponse.json(
        { error: 'Failed to mark loan as repaid' },
        { status: 500 }
      )
    }

    // Send notification to lender if we have their FID
    if (loan.lender_fid) {
      try {
        // Get borrower and lender names for notification
        const [borrowerData, lenderData] = await Promise.all([
          getUserByFid(loan.borrower_fid),
          getUserByFid(loan.lender_fid)
        ])

        const borrowerName = (borrowerData as any)?.display_name || (borrowerData as any)?.username || `FID ${loan.borrower_fid}`
        const lenderName = (lenderData as any)?.display_name || (lenderData as any)?.username || `FID ${loan.lender_fid}`

        // Notify lender about repayment
        await notificationService.notifyLoanRepaid(
          loan.lender_fid,
          params.id,
          borrowerName,
          loan.repay_usdc || 0,
          isOnTime,
          undefined, // signerUuid - would need to be passed from frontend
          loan.cast_hash
        )

        console.log(`Sent repayment notification to lender FID ${loan.lender_fid}`)
      } catch (notificationError) {
        console.error('Failed to send repayment notification:', notificationError)
        // Don't fail the repayment if notification fails
      }
    }

    console.log(`Loan ${params.id} marked as repaid${isOnTime ? ' on time' : ' late'}`)

    return NextResponse.json({
      success: true,
      isOnTime,
      repaidAt: repaidAt.toISOString(),
      message: `Loan successfully marked as repaid${isOnTime ? ' on time' : ' (late)'}`
    })
  } catch (error) {
    console.error('Error marking loan as repaid:', error)
    return NextResponse.json(
      { error: 'Failed to mark loan as repaid' },
      { status: 500 }
    )
  }
}