import { NeynarAPIClient } from '@neynar/nodejs-sdk'

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!)

// Development mode flag
const isDev = process.env.NODE_ENV === 'development'

export async function createLoanCast(
  signerUuid: string,
  amount: number,
  yieldBps: number,
  dueDate: Date,
  loanId?: string
) {
  const apr = yieldBps / 100
  const repayAmount = amount + (amount * yieldBps) / 10000
  
  const castText = `┏━ ${loanId || 'LOANCAST'} ━┓
Amount: $${amount.toFixed(2)} USDC
Yield: 2.0% monthly
Repay: $${repayAmount.toFixed(2)} on ${dueDate.toLocaleDateString()}
Highest bid = lender. This cast is the note.
┗━━━━━━━━━━━━━━┛

🤝 Friend-to-friend lending • No securities • Trust-based`

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