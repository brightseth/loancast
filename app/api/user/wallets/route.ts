import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { getUserByFid } from '@/lib/neynar'

export async function GET(request: NextRequest) {
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    // Get user session from cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    const userFid = session.fid

    // Get user profile from Neynar to get connected wallets
    const userData = await getUserByFid(userFid)
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract verified addresses from Farcaster profile
    // Neynar v2 API uses 'verifications' array for verified addresses
    const verifications = (userData as any).verifications || []
    const verifiedAddresses = verifications.filter((v: any) => 
      typeof v === 'string' && v.startsWith('0x')
    )
    
    // Also check for custody address
    const custodyAddress = (userData as any).custody_address || (userData as any).custodial_address
    
    console.log(`Found ${verifiedAddresses.length} verified addresses for FID ${userFid}`)
    
    // Format wallets for the frontend
    const wallets = []
    const seenAddresses = new Set<string>()
    
    // Add verified addresses (no duplicates)
    for (const address of verifiedAddresses) {
      const lowerAddress = address.toLowerCase()
      if (!seenAddresses.has(lowerAddress)) {
        seenAddresses.add(lowerAddress)
        wallets.push({
          address: address,
          chain: 'base', // Farcaster verified addresses work on Base
          display: `${address.slice(0, 6)}...${address.slice(-4)}`,
          verified: true,
          // In production, would check actual balance
          balance: null
        })
      }
    }
    
    // Add custody address if different and exists
    if (custodyAddress && !verifiedAddresses.includes(custodyAddress)) {
      wallets.push({
        address: custodyAddress,
        chain: 'base',
        display: `${custodyAddress.slice(0, 6)}...${custodyAddress.slice(-4)}`,
        verified: false,
        custody: true,
        balance: null
      })
    }
    
    // Log wallet detection results
    console.log(`Wallet detection for FID ${userFid}:`, {
      verifiedCount: verifiedAddresses.length,
      hasCustody: !!custodyAddress,
      totalWallets: wallets.length
    })

    return NextResponse.json({ 
      wallets,
      primaryWallet: verifiedAddresses[0] || custodyAddress 
    })
  } catch (error) {
    console.error('Error fetching user wallets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    )
  }
}