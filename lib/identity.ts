import { normalize } from 'viem/ens'
import { createPublicClient, http } from 'viem'
import { base, mainnet } from 'viem/chains'
import { rpcClient } from './rpc-client'
import { supabaseAdmin } from './supabase'

// Identity verification types
export interface IdentitySignals {
  fid: string
  hasEns: boolean
  hasBasename: boolean
  ensName?: string
  basename?: string
  verifiedWallets: string[]
  powerBadge: boolean
  accountAge: number // days
  followerCount: number
}

// ENS/Basename bonus points for reputation
export const IDENTITY_BONUSES = {
  ENS_OWNERSHIP: 50,      // +50 points for ENS
  BASENAME_OWNERSHIP: 30, // +30 points for Basename
  POWER_BADGE: 40,        // +40 points for Farcaster power badge
  VERIFIED_WALLET: 20     // +20 points per verified wallet (max 3)
}

// Higher loan caps for verified identities
export const VERIFIED_LOAN_CAPS = {
  ENS_HOLDER: 500,        // $500 for ENS holders (vs $200 base)
  BASENAME_HOLDER: 400,   // $400 for Basename holders
  POWER_BADGE: 450,       // $450 for power badge holders
  MULTI_VERIFIED: 350     // $350 for 2+ verified wallets
}

// Create Ethereum mainnet client for ENS resolution
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
  batch: {
    multicall: true,
  }
})

// Create Base client for Basename resolution
const baseClient = rpcClient.getCurrentClient()

/**
 * Resolve ENS name for an address on Ethereum mainnet
 */
export async function resolveEns(address: string): Promise<string | null> {
  try {
    const name = await mainnetClient.getEnsName({
      address: address as `0x${string}`,
    })
    return name
  } catch (error) {
    console.error('Error resolving ENS:', error)
    return null
  }
}

/**
 * Resolve Basename for an address on Base
 */
export async function resolveBasename(address: string): Promise<string | null> {
  try {
    // Basenames use the same ENS infrastructure but on Base L2
    // The Base Name Service contract is at a specific address on Base
    const name = await baseClient.getEnsName({
      address: address as `0x${string}`,
      universalResolverAddress: '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD', // Base Name Service
    })
    return name
  } catch (error) {
    console.error('Error resolving Basename:', error)
    return null
  }
}

/**
 * Check if address owns an ENS name
 */
export async function checkEnsOwnership(address: string): Promise<{ hasEns: boolean; name?: string }> {
  try {
    const ensName = await resolveEns(address)
    if (!ensName) return { hasEns: false }
    
    // Verify reverse resolution (that they actually own it)
    const resolvedAddress = await mainnetClient.getEnsAddress({
      name: normalize(ensName),
    })
    
    if (resolvedAddress?.toLowerCase() === address.toLowerCase()) {
      return { hasEns: true, name: ensName }
    }
    
    return { hasEns: false }
  } catch (error) {
    console.error('Error checking ENS ownership:', error)
    return { hasEns: false }
  }
}

/**
 * Check if address owns a Basename
 */
export async function checkBasenameOwnership(address: string): Promise<{ hasBasename: boolean; name?: string }> {
  try {
    const basename = await resolveBasename(address)
    if (!basename) return { hasBasename: false }
    
    // Verify reverse resolution
    const resolvedAddress = await baseClient.getEnsAddress({
      name: normalize(basename),
      universalResolverAddress: '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD',
    })
    
    if (resolvedAddress?.toLowerCase() === address.toLowerCase()) {
      return { hasBasename: true, name: basename }
    }
    
    return { hasBasename: false }
  } catch (error) {
    console.error('Error checking Basename ownership:', error)
    return { hasBasename: false }
  }
}

/**
 * Get all identity signals for a user
 */
export async function getIdentitySignals(fid: string, farcasterUser?: any): Promise<IdentitySignals> {
  try {
    // Get user data from database
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('fid', fid)
      .single()
    
    // Extract verified wallets from Farcaster profile
    const verifications = farcasterUser?.verifications || []
    const verifiedWallets = verifications.filter((v: any) => 
      typeof v === 'string' && v.startsWith('0x')
    )
    
    // Check for ENS and Basename ownership
    let hasEns = false
    let hasBasename = false
    let ensName: string | undefined
    let basename: string | undefined
    
    // Check each verified wallet for ENS/Basename
    for (const wallet of verifiedWallets.slice(0, 3)) { // Check max 3 wallets
      if (!hasEns) {
        const ensCheck = await checkEnsOwnership(wallet)
        if (ensCheck.hasEns) {
          hasEns = true
          ensName = ensCheck.name
        }
      }
      
      if (!hasBasename) {
        const basenameCheck = await checkBasenameOwnership(wallet)
        if (basenameCheck.hasBasename) {
          hasBasename = true
          basename = basenameCheck.name
        }
      }
      
      if (hasEns && hasBasename) break // Found both, stop checking
    }
    
    // Check for power badge (>400 followers)
    const powerBadge = (farcasterUser?.follower_count || 0) >= 400
    
    // Calculate account age in days
    const accountCreated = farcasterUser?.created_at 
      ? new Date(farcasterUser.created_at) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default 30 days
    const accountAge = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      fid,
      hasEns,
      hasBasename,
      ensName,
      basename,
      verifiedWallets,
      powerBadge,
      accountAge,
      followerCount: farcasterUser?.follower_count || 0
    }
  } catch (error) {
    console.error('Error getting identity signals:', error)
    return {
      fid,
      hasEns: false,
      hasBasename: false,
      verifiedWallets: [],
      powerBadge: false,
      accountAge: 0,
      followerCount: 0
    }
  }
}

/**
 * Calculate identity bonus for reputation score
 */
export function calculateIdentityBonus(signals: IdentitySignals): number {
  let bonus = 0
  
  if (signals.hasEns) bonus += IDENTITY_BONUSES.ENS_OWNERSHIP
  if (signals.hasBasename) bonus += IDENTITY_BONUSES.BASENAME_OWNERSHIP
  if (signals.powerBadge) bonus += IDENTITY_BONUSES.POWER_BADGE
  
  // Bonus for multiple verified wallets (max 3)
  const walletBonus = Math.min(signals.verifiedWallets.length, 3) * IDENTITY_BONUSES.VERIFIED_WALLET
  bonus += walletBonus
  
  return bonus
}

/**
 * Get enhanced loan cap based on identity verification
 */
export function getIdentityBasedLoanCap(signals: IdentitySignals, baseAmount: number): number {
  // Priority order: ENS > Power Badge > Basename > Multi-wallet
  if (signals.hasEns) {
    return Math.max(baseAmount, VERIFIED_LOAN_CAPS.ENS_HOLDER)
  }
  
  if (signals.powerBadge) {
    return Math.max(baseAmount, VERIFIED_LOAN_CAPS.POWER_BADGE)
  }
  
  if (signals.hasBasename) {
    return Math.max(baseAmount, VERIFIED_LOAN_CAPS.BASENAME_HOLDER)
  }
  
  if (signals.verifiedWallets.length >= 2) {
    return Math.max(baseAmount, VERIFIED_LOAN_CAPS.MULTI_VERIFIED)
  }
  
  return baseAmount
}

/**
 * Store identity signals in database
 */
export async function storeIdentitySignals(fid: string, signals: IdentitySignals) {
  try {
    const updates = {
      ens_name: signals.ensName,
      basename: signals.basename,
      has_ens: signals.hasEns,
      has_basename: signals.hasBasename,
      power_badge: signals.powerBadge,
      verified_wallets: signals.verifiedWallets,
      identity_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('fid', fid)
    
    if (error) {
      console.error('Error storing identity signals:', error)
    }
    
    return !error
  } catch (error) {
    console.error('Error updating identity data:', error)
    return false
  }
}

/**
 * Format identity display name
 */
export function formatIdentityDisplay(signals: IdentitySignals, address?: string): string {
  if (signals.ensName) return signals.ensName
  if (signals.basename) return signals.basename
  if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`
  return 'Anonymous'
}

/**
 * Get identity badges for display
 */
export function getIdentityBadges(signals: IdentitySignals): Array<{ name: string; icon: string; color: string }> {
  const badges = []
  
  if (signals.hasEns) {
    badges.push({
      name: 'ENS',
      icon: '🌐',
      color: 'text-blue-600'
    })
  }
  
  if (signals.hasBasename) {
    badges.push({
      name: 'Base',
      icon: '🔵',
      color: 'text-blue-500'
    })
  }
  
  if (signals.powerBadge) {
    badges.push({
      name: 'Power',
      icon: '⚡',
      color: 'text-purple-600'
    })
  }
  
  if (signals.verifiedWallets.length >= 3) {
    badges.push({
      name: 'Multi-Wallet',
      icon: '🔗',
      color: 'text-green-600'
    })
  }
  
  return badges
}