import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { signerUuid } = await req.json()
    
    if (!signerUuid) {
      return NextResponse.json({ error: 'No signer UUID provided' }, { status: 400 })
    }

    // Get user info from Neynar
    const response = await fetch(`https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signerUuid}`, {
      headers: {
        'api_key': process.env.NEYNAR_API_KEY!
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch signer')
    }

    const data = await response.json()
    const user = data.fid_metadata

    return NextResponse.json({
      fid: user.fid,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      verifiedWallet: user.verified_addresses?.eth_addresses?.[0] || null
    })
  } catch (error) {
    console.error('Neynar auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}