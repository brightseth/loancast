import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { getUserByFid } from '@/lib/neynar'
import { getIdentitySignals, storeIdentitySignals, formatIdentityDisplay, getIdentityBadges } from '@/lib/identity'
import { calculateReputationScore } from '@/lib/reputation'

export async function POST(request: NextRequest) {
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    // Get FID from request body or session
    const body = await request.json().catch(() => ({}))
    const requestFid = body.fid
    
    let userFid: number
    
    if (requestFid) {
      userFid = parseInt(requestFid)
    } else {
      // Get from session
      const cookieStore = cookies()
      const sessionCookie = cookieStore.get('session')
      
      if (!sessionCookie) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
      
      const session = JSON.parse(sessionCookie.value)
      userFid = session.fid
    }
    
    console.log(`Verifying identity for FID ${userFid}`)
    
    // Get Farcaster profile
    const farcasterUser = await getUserByFid(userFid)
    
    if (!farcasterUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Get identity signals
    const signals = await getIdentitySignals(userFid.toString(), farcasterUser)
    
    // Store signals in database
    await storeIdentitySignals(userFid.toString(), signals)
    
    // Recalculate reputation with new identity data
    const reputation = await calculateReputationScore(userFid.toString())
    
    // Format response
    const identityBadges = getIdentityBadges(signals)
    const displayName = formatIdentityDisplay(signals)
    
    console.log(`Identity verified for FID ${userFid}:`, {
      hasEns: signals.hasEns,
      hasBasename: signals.hasBasename,
      powerBadge: signals.powerBadge,
      walletCount: signals.verifiedWallets.length,
      newScore: reputation.score,
      newMaxLoan: reputation.maxLoanAmount
    })
    
    return NextResponse.json({
      success: true,
      identity: {
        fid: userFid,
        displayName,
        ensName: signals.ensName,
        basename: signals.basename,
        hasEns: signals.hasEns,
        hasBasename: signals.hasBasename,
        powerBadge: signals.powerBadge,
        verifiedWallets: signals.verifiedWallets,
        badges: identityBadges
      },
      reputation: {
        score: reputation.score,
        maxLoanAmount: reputation.maxLoanAmount,
        totalLoans: reputation.totalLoans,
        repaidLoans: reputation.repaidLoans
      }
    })
    
  } catch (error) {
    console.error('Error verifying identity:', error)
    return NextResponse.json(
      { error: 'Failed to verify identity' },
      { status: 500 }
    )
  }
}

// GET endpoint to check current identity status
export async function GET(request: NextRequest) {
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    const { searchParams } = new URL(request.url)
    const queryFid = searchParams.get('fid')
    
    let userFid: number
    
    if (queryFid) {
      userFid = parseInt(queryFid)
    } else {
      const cookieStore = cookies()
      const sessionCookie = cookieStore.get('session')
      
      if (!sessionCookie) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
      
      const session = JSON.parse(sessionCookie.value)
      userFid = session.fid
    }
    
    // Get Farcaster profile
    const farcasterUser = await getUserByFid(userFid)
    
    if (!farcasterUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Get cached identity signals (don't re-verify, just return current state)
    const signals = await getIdentitySignals(userFid.toString(), farcasterUser)
    const identityBadges = getIdentityBadges(signals)
    const displayName = formatIdentityDisplay(signals)
    
    return NextResponse.json({
      identity: {
        fid: userFid,
        displayName,
        ensName: signals.ensName,
        basename: signals.basename,
        hasEns: signals.hasEns,
        hasBasename: signals.hasBasename,
        powerBadge: signals.powerBadge,
        verifiedWallets: signals.verifiedWallets,
        badges: identityBadges
      }
    })
    
  } catch (error) {
    console.error('Error checking identity:', error)
    return NextResponse.json(
      { error: 'Failed to check identity' },
      { status: 500 }
    )
  }
}