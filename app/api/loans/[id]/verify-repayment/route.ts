import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

    // For now, we'll do a simplified verification
    // In production, this would verify the transaction on Base blockchain
    console.log(`Verifying repayment transaction: ${tx_hash}`)

    // Basic validation - transaction hash format
    if (!tx_hash.startsWith('0x') || tx_hash.length !== 66) {
      return NextResponse.json({
        isValid: false,
        error: 'Invalid transaction hash format'
      })
    }

    // Mock verification for now - in production, use a blockchain API
    // to verify the transaction exists, amount matches, and recipient is correct
    const mockVerification = {
      isValid: true,
      txHash: tx_hash,
      blockNumber: Math.floor(Math.random() * 1000000) + 20000000,
      amount: loan.repay_usdc?.toFixed(2) || '0',
      verified: true
    }

    console.log('Transaction verification result:', mockVerification)

    return NextResponse.json(mockVerification)
  } catch (error) {
    console.error('Error verifying repayment:', error)
    return NextResponse.json(
      { error: 'Failed to verify transaction' },
      { status: 500 }
    )
  }
}