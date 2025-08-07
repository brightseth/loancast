import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fid = searchParams.get('fid') || '5046'
  
  try {
    // Test profile API
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://loancast.app'}/api/profiles/${fid}`
    const profileResponse = await fetch(profileUrl)
    const profileData = await profileResponse.json()
    
    // Test loans API
    const loansUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://loancast.app'}/api/loans?borrower_fid=${fid}`
    const loansResponse = await fetch(loansUrl)
    const loansData = await loansResponse.json()
    
    return NextResponse.json({
      success: true,
      fid,
      profile: {
        status: profileResponse.status,
        data: profileData
      },
      loans: {
        status: loansResponse.status,
        count: Array.isArray(loansData) ? loansData.length : 0,
        data: loansData
      },
      debug: {
        profileUrl,
        loansUrl,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fid
    }, { status: 500 })
  }
}