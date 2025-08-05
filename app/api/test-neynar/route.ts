import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test fetching a known Farcaster user (dwr.eth - FID 3)
    const response = await fetch('https://api.neynar.com/v2/farcaster/user/bulk?fids=3', {
      headers: {
        'api_key': process.env.NEYNAR_API_KEY!,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ 
        error: 'Neynar API failed', 
        status: response.status,
        details: error 
      }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ 
      success: true, 
      user: data.users?.[0],
      message: 'Neynar API is working!' 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to test Neynar API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}