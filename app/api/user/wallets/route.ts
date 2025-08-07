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
    const verifiedAddresses = (userData as any).verified_addresses?.eth_addresses || []
    const custodyAddress = (userData as any).custody_address
    
    // Format wallets for the frontend
    const wallets = []
    
    // Add verified addresses
    for (const address of verifiedAddresses) {
      wallets.push({
        address: address,
        chain: 'base', // Farcaster verified addresses work on Base
        display: `${address.slice(0, 6)}...${address.slice(-4)}`,
        verified: true,
        // In production, would check actual balance
        balance: null
      })
    }
    
    // Add custody address if different
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