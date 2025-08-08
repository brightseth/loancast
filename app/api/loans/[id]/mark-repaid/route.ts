import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
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
  
  // Add CORS headers for browser requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const { tx_hash, from_wallet } = await request.json()
    
    console.log(`Mark repaid request for loan ${params.id}:`, {
      tx_hash,
      from_wallet,
      timestamp: new Date().toISOString()
    })

    if (!tx_hash) {
      console.error('Missing transaction hash')
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400, headers }
      )
    }

    // Get the loan details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', params.id)
      .single()

    if (loanError || !loan) {
      console.error('Loan lookup failed:', { loanError, loanId: params.id })
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404, headers }
      )
    }
    
    console.log('Found loan:', { 
      id: loan.id, 
      status: loan.status, 
      borrower_fid: loan.borrower_fid,
      repay_usdc: loan.repay_usdc
    })

    if (loan.status !== 'funded') {
      console.error('Invalid loan status:', loan.status)
      return NextResponse.json(
        { error: `Loan is not in funded status (current: ${loan.status})` },
        { status: 400, headers }
      )
    }

    // Check if loan is already repaid
    if (loan.status === 'repaid') {
      console.error('Loan already repaid')
      return NextResponse.json(
        { error: 'Loan has already been marked as repaid' },
        { status: 400, headers }
      )
    }

    // Calculate if repayment is on time (use repay_by field, fallback to due_ts)
    const dueDateField = loan.repay_by || loan.due_ts
    const dueDate = new Date(dueDateField)
    const repaidAt = new Date()
    const isOnTime = repaidAt <= dueDate

    // Update loan status to repaid
    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        status: 'repaid',
        updated_at: repaidAt.toISOString(),
        tx_repay: tx_hash
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Database update failed:', updateError)
      return NextResponse.json(
        { error: `Database error: ${updateError.message}` },
        { status: 500, headers }
      )
    }
    
    console.log(`Successfully marked loan ${params.id} as repaid`)

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
    }, { headers })
  } catch (error) {
    console.error('Error marking loan as repaid:', error)
    return NextResponse.json(
      { error: 'Failed to mark loan as repaid' },
      { status: 500, headers }
    )
  }
}