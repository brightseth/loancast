import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserByFid } from '@/lib/neynar'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = params.id

    // Get loan details
    const { data: loan, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single()

    if (error || !loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    if (!loan.lender_fid) {
      return NextResponse.json(
        { error: 'Loan not yet funded' },
        { status: 400 }
      )
    }

    // Get lender's profile from Neynar
    const lenderData = await getUserByFid(loan.lender_fid)
    
    if (!lenderData) {
      // Fallback: if we can't get from Neynar, check if we stored it
      return NextResponse.json({
        wallet: loan.lender_address || null,
        source: 'database'
      })
    }

    // Get the lender's verified addresses
    const verifiedAddresses = (lenderData as any).verified_addresses?.eth_addresses || []
    const custodyAddress = (lenderData as any).custody_address
    
    // The primary wallet is usually the first verified address or custody address
    const lenderWallet = verifiedAddresses[0] || custodyAddress || loan.lender_address

    if (!lenderWallet) {
      return NextResponse.json(
        { error: 'Lender wallet not found' },
        { status: 404 }
      )
    }

    // In the future, we could check on-chain who holds the NFT/collectible
    // For now, we trust the Farcaster verified addresses
    
    return NextResponse.json({
      wallet: lenderWallet,
      lenderFid: loan.lender_fid,
      lenderName: (lenderData as any)?.display_name || (lenderData as any)?.username || 'Unknown',
      verified: verifiedAddresses.includes(lenderWallet),
      source: 'farcaster'
    })
  } catch (error) {
    console.error('Error fetching lender wallet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lender wallet' },
      { status: 500 }
    )
  }
}