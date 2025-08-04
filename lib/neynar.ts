import { NeynarAPIClient } from '@neynar/nodejs-sdk'

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!)

// Development mode flag
const isDev = process.env.NODE_ENV === 'development'

export async function createLoanCast(
  signerUuid: string,
  amount: number,
  yieldBps: number,
  dueDate: Date
) {
  const apr = yieldBps / 100
  const repayAmount = amount + (amount * yieldBps) / 10000
  
  const castText = `🏦 LOANCAST REQUEST

Amount: $${amount.toFixed(2)} USDC
Rate: 2% monthly (24% APR)
Repay: $${repayAmount.toFixed(2)}
Due: ${dueDate.toLocaleDateString()}

Fixed rate social lending on Farcaster.
Powered by @loancast`

  try {
    if (isDev) {
      // Mock response for development
      return {
        hash: `0x${Math.random().toString(16).slice(2, 18)}`,
        success: true,
        cast: { text: castText }
      }
    }

    const cast = await client.publishCast(signerUuid, castText, {
      embeds: [],
    })
    
    return cast
  } catch (error) {
    console.error('Error creating cast:', error)
    
    // Fallback to mock in development if API fails
    if (isDev) {
      return {
        hash: `0x${Math.random().toString(16).slice(2, 18)}`,
        success: true,
        cast: { text: castText }
      }
    }
    
    throw error
  }
}

export async function getUserByFid(fid: number) {
  try {
    const user = await client.lookupUserByFid(fid)
    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}