// Cast NFT holder lookup for accurate repayment addressing
// Based on Henry's explanation of the auction system

import { NeynarAPIClient } from '@neynar/nodejs-sdk'

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!)

// Farcaster Protocol NFT contract on Base
const FARCASTER_NFT_CONTRACT = '0x00000000fcCe7f938e7aE6D3c335bD6a1a7c593D' // Zora NFT contract for casts
const BASE_RPC_URL = 'https://mainnet.base.org'

interface CastNFTInfo {
  holderAddress: string
  tokenId: string
  contractAddress: string
}

interface RepaymentAddressResult {
  repaymentAddress: string
  verified: boolean
  nftHolder: string
  connectedAddresses: string[]
  error?: string
}

/**
 * Look up who holds the NFT for a given cast hash
 */
export async function getCastNFTHolder(castHash: string): Promise<CastNFTInfo | null> {
  try {
    // First, get cast details from Neynar to find if it was minted
    const cast = await neynarClient.lookUpCastByHashOrWarpcastUrl(castHash, 'hash')
    
    // Check if cast has NFT mint information
    if (!cast?.cast) {
      console.log('Cast not found or no cast data')
      return null
    }

    // Look for mint/collection in cast embeds or replies
    // Farcaster casts can be minted as NFTs via various platforms
    
    // For now, let's use a direct contract query approach
    // This will need to be updated based on the actual NFT contract being used
    
    // Try to find NFT mint transaction in cast replies or embeds
    const mintInfo = await findNFTMintFromCast(cast.cast)
    
    if (mintInfo) {
      return mintInfo
    }

    console.log('No NFT mint found for cast:', castHash)
    return null

  } catch (error) {
    console.error('Error looking up cast NFT holder:', error)
    return null
  }
}

/**
 * Find NFT mint information from cast data
 */
async function findNFTMintFromCast(cast: any): Promise<CastNFTInfo | null> {
  try {
    // Check embeds for NFT links
    if (cast.embeds) {
      for (const embed of cast.embeds) {
        if (embed.url && (embed.url.includes('zora.co') || embed.url.includes('mint'))) {
          // This is a potential NFT mint link
          // Extract contract and token info from URL
          const nftInfo = await parseNFTUrlForContractInfo(embed.url)
          if (nftInfo) {
            return nftInfo
          }
        }
      }
    }

    // Check replies for mint confirmations
    // This would require fetching replies and looking for mint transaction hashes
    
    return null
  } catch (error) {
    console.error('Error parsing cast for NFT info:', error)
    return null
  }
}

/**
 * Parse NFT URL to extract contract and token information
 */
async function parseNFTUrlForContractInfo(url: string): Promise<CastNFTInfo | null> {
  try {
    // Example URL patterns:
    // https://zora.co/collect/base:0xcontractaddress/tokenid
    // https://mint.fun/base/0xcontractaddress/tokenid
    
    const patterns = [
      /zora\.co\/collect\/base:([0-9a-fA-Fx]+)\/(\d+)/,
      /mint\.fun\/base\/([0-9a-fA-Fx]+)\/(\d+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        const contractAddress = match[1]
        const tokenId = match[2]
        
        // Query the contract to find current owner
        const owner = await getERC721Owner(contractAddress, tokenId)
        
        if (owner) {
          return {
            holderAddress: owner,
            tokenId,
            contractAddress
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error parsing NFT URL:', error)
    return null
  }
}

/**
 * Query ERC721 contract for token owner
 */
async function getERC721Owner(contractAddress: string, tokenId: string): Promise<string | null> {
  try {
    const response = await fetch(BASE_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data: `0x6352211e${tokenId.padStart(64, '0')}` // ownerOf(tokenId) function signature
          },
          'latest'
        ]
      })
    })

    const { result } = await response.json()
    
    if (result && result !== '0x') {
      // Extract address from result (last 40 characters, add 0x prefix)
      return '0x' + result.slice(-40)
    }

    return null
  } catch (error) {
    console.error('Error querying ERC721 owner:', error)
    return null
  }
}

/**
 * Get user's connected addresses from Neynar
 */
export async function getUserConnectedAddresses(fid: number): Promise<string[]> {
  try {
    const user = await neynarClient.fetchBulkUsers([fid])
    
    if (user.users && user.users.length > 0) {
      const userInfo = user.users[0]
      
      // Extract verified addresses
      const verifiedAddresses = userInfo.verified_addresses?.eth_addresses || []
      
      // Also check custody address
      const custodyAddress = userInfo.custody_address
      
      const allAddresses = [...verifiedAddresses]
      if (custodyAddress) {
        allAddresses.push(custodyAddress)
      }

      return allAddresses.map(addr => addr.toLowerCase())
    }

    return []
  } catch (error) {
    console.error('Error fetching user connected addresses:', error)
    return []
  }
}

/**
 * Main function: Get verified repayment address for a loan
 */
export async function getVerifiedRepaymentAddress(
  castHash: string, 
  lenderFid: number
): Promise<RepaymentAddressResult> {
  try {
    console.log(`Getting repayment address for cast ${castHash}, lender FID ${lenderFid}`)

    // Step 1: Find NFT holder
    const nftInfo = await getCastNFTHolder(castHash)
    
    if (!nftInfo) {
      return {
        repaymentAddress: '',
        verified: false,
        nftHolder: '',
        connectedAddresses: [],
        error: 'Cast NFT not found or not minted'
      }
    }

    console.log(`Found NFT holder: ${nftInfo.holderAddress}`)

    // Step 2: Get lender's connected addresses
    const connectedAddresses = await getUserConnectedAddresses(lenderFid)
    
    console.log(`Lender connected addresses:`, connectedAddresses)

    // Step 3: Verify NFT holder is in connected addresses
    const nftHolderLower = nftInfo.holderAddress.toLowerCase()
    const isVerified = connectedAddresses.includes(nftHolderLower)

    if (!isVerified) {
      return {
        repaymentAddress: '',
        verified: false,
        nftHolder: nftInfo.holderAddress,
        connectedAddresses,
        error: `NFT holder ${nftInfo.holderAddress} is not in lender's connected addresses. Possible NFT transfer to unassociated wallet.`
      }
    }

    // Step 4: Return verified repayment address
    return {
      repaymentAddress: nftInfo.holderAddress,
      verified: true,
      nftHolder: nftInfo.holderAddress,
      connectedAddresses
    }

  } catch (error) {
    console.error('Error getting verified repayment address:', error)
    return {
      repaymentAddress: '',
      verified: false,
      nftHolder: '',
      connectedAddresses: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}