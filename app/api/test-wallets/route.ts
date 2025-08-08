import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserByFid } from '@/lib/neynar'
import { guardTestEndpoint } from '@/lib/launch-guard'

export async function GET(request: NextRequest) {
  // Guard test endpoint in production
  const guard = guardTestEndpoint()
  if (guard) return guard

  try {
    // Get user session from cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    const userFid = session.fid

    // Get user profile from Neynar to debug the structure
    const userData = await getUserByFid(userFid)
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log the full structure to understand what fields are available
    console.log('Full user data structure:', JSON.stringify(userData, null, 2))

    // Try different possible field names for wallets
    const possibleWalletFields = {
      verified_addresses: (userData as any).verified_addresses,
      verifications: (userData as any).verifications,
      connected_addresses: (userData as any).connected_addresses,
      eth_addresses: (userData as any).eth_addresses,
      addresses: (userData as any).addresses,
      custody_address: (userData as any).custody_address,
      custodial_address: (userData as any).custodial_address,
      wallet: (userData as any).wallet,
      wallets: (userData as any).wallets,
    }

    // Extract all possible addresses
    const wallets = []
    
    // Check verifications array (most common in Neynar v2)
    if ((userData as any).verifications && Array.isArray((userData as any).verifications)) {
      for (const verification of (userData as any).verifications) {
        if (verification.startsWith('0x')) {
          wallets.push({
            address: verification,
            chain: 'ethereum',
            display: `${verification.slice(0, 6)}...${verification.slice(-4)}`,
            verified: true,
            source: 'verifications'
          })
        }
      }
    }

    // Check verified_addresses
    if ((userData as any).verified_addresses) {
      const va = (userData as any).verified_addresses
      
      // Check for eth_addresses array
      if (va.eth_addresses && Array.isArray(va.eth_addresses)) {
        for (const address of va.eth_addresses) {
          wallets.push({
            address: address,
            chain: 'ethereum',
            display: `${address.slice(0, 6)}...${address.slice(-4)}`,
            verified: true,
            source: 'verified_addresses.eth_addresses'
          })
        }
      }
      
      // Check for direct array
      if (Array.isArray(va)) {
        for (const address of va) {
          if (typeof address === 'string' && address.startsWith('0x')) {
            wallets.push({
              address: address,
              chain: 'ethereum',
              display: `${address.slice(0, 6)}...${address.slice(-4)}`,
              verified: true,
              source: 'verified_addresses_array'
            })
          }
        }
      }
    }

    // Add custody address
    const custodyAddress = (userData as any).custody_address || (userData as any).custodial_address
    if (custodyAddress) {
      wallets.push({
        address: custodyAddress,
        chain: 'ethereum',
        display: `${custodyAddress.slice(0, 6)}...${custodyAddress.slice(-4)}`,
        verified: false,
        custody: true,
        source: 'custody_address'
      })
    }

    return NextResponse.json({ 
      success: true,
      userFid,
      wallets,
      walletsFound: wallets.length,
      debugInfo: {
        hasVerifications: !!(userData as any).verifications,
        hasVerifiedAddresses: !!(userData as any).verified_addresses,
        hasCustodyAddress: !!custodyAddress,
        fieldSnapshot: possibleWalletFields
      },
      userData: {
        fid: (userData as any).fid,
        username: (userData as any).username,
        display_name: (userData as any).display_name,
        // Include only non-sensitive fields for debugging
      }
    })
  } catch (error) {
    console.error('Error in test-wallets:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch wallets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}