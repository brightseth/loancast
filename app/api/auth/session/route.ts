import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json()
    
    if (!user || !user.fid) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
    }

    // Create session cookie
    const sessionData = {
      fid: user.fid,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
      verifiedWallet: user.verifiedWallet,
      signerUuid: user.signerUuid,
      loginTime: Date.now()
    }

    const response = NextResponse.json({ success: true })
    
    // Set httpOnly session cookie
    response.cookies.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Session creation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false })
    }

    const session = JSON.parse(sessionCookie.value)
    return NextResponse.json({ 
      authenticated: true,
      user: {
        fid: session.fid,
        displayName: session.displayName,
        pfpUrl: session.pfpUrl,
        verifiedWallet: session.verifiedWallet
      }
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('session')
  return response
}