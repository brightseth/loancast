import { NextRequest, NextResponse } from 'next/server'
import { getUserByFid } from '@/lib/neynar'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fid = searchParams.get('fid') || '1'
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    fid: fid,
    nodeEnv: process.env.NODE_ENV,
    hasNeynarKey: !!process.env.NEYNAR_API_KEY,
    neynarKeyLength: process.env.NEYNAR_API_KEY?.length || 0,
    userAgent: request.headers.get('user-agent'),
  }

  try {
    console.log('Debug profile request:', debugInfo)
    
    const fidNum = parseInt(fid)
    if (isNaN(fidNum)) {
      return NextResponse.json({
        ...debugInfo,
        error: 'Invalid FID - must be a number',
        success: false
      })
    }

    const user = await getUserByFid(fidNum)
    
    return NextResponse.json({
      ...debugInfo,
      success: !!user,
      userFound: !!user,
      userData: user ? {
        display_name: (user as any).display_name,
        username: (user as any).username,
        fid: fidNum
      } : null,
      fallbackAvailable: [1, 2, 3, 12345].includes(fidNum),
    })
    
  } catch (error) {
    console.error('Debug profile error:', error)
    return NextResponse.json({
      ...debugInfo,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    })
  }
}