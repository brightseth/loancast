import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('farcaster_user')
    
    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session cookie found'
      })
    }

    const sessionData = JSON.parse(sessionCookie.value)
    
    return NextResponse.json({
      authenticated: true,
      user: sessionData,
      fid: sessionData.fid,
      username: sessionData.username,
      message: 'Session data retrieved'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse session',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}