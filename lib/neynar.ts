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
  const repayAmount = amount + (amount * yieldBps) / 10000
  const monthlyRate = 2.0 // Fixed 2% monthly rate
  const daysToRepay = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const netAmount = Math.floor(amount * 0.9) // After 10% platform fee
  
  const dueDateStr = dueDate.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
  
  const castText = `┏━ ${loanId || 'LOANCAST'} ━┓

🏦 Borrow ≤ ${amount.toLocaleString()} USDC
📅 ${daysToRepay} days • due ${dueDateStr}
📈 Yield ${monthlyRate}% monthly → repay ${repayAmount.toFixed(0)} USDC
🎯 Highest bid = lender
💰 I eat Farcaster's 10% (get ${netAmount} USDC)
⚠️ This cast *is* the note

Cast on @loancast

┗━━━━━━━━━━━━━━━━━┛`

  // Check if we have a valid signer UUID (not mock/default)
  const hasValidSigner = signerUuid && 
    signerUuid !== 'default-signer' && 
    signerUuid !== 'mock-signer' &&
    signerUuid.length > 20 // Real signer UUIDs are longer

  try {
    if (!hasValidSigner || isDev) {
      console.log('Using mock cast response - no valid signer or development mode')
      return {
        hash: `mock-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        success: true,
        cast: { 
          text: castText,
          hash: `mock-${Date.now()}`,
          author: { fid: 0 },
          timestamp: new Date().toISOString()
        }
      }
    }

    console.log('Creating real cast with signer:', signerUuid.slice(0, 8) + '...')
    const cast = await client.publishCast(signerUuid, castText, {
      embeds: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://loancast.app'}/explore`
        }
      ],
    })
    
    console.log('Cast created successfully:', cast.hash)
    return cast
  } catch (error) {
    console.error('Error creating cast:', error)
    
    // If production cast fails, create database entry but with mock hash
    // This prevents loan creation from failing due to cast issues
    console.log('Cast failed, falling back to mock response')
    return {
      hash: `failed-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cast: { 
        text: castText,
        hash: `failed-${Date.now()}`,
        author: { fid: 0 },
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Cast when a loan gets funded
export async function createFundingCast(
  signerUuid: string,
  loanId: string,
  originalCastHash: string,
  lenderName: string,
  borrowerName: string,
  amount: number
) {
  const castText = `🎉 ${loanId} has been funded!

💰 ${lenderName} is lending ${amount.toLocaleString()} USDC to ${borrowerName}
🤝 Trust-based transaction complete
⏰ Repayment timer starts now

#LoanCast #DeFi #TrustlessIsFriendsless`

  try {
    const hasValidSigner = signerUuid && 
      signerUuid !== 'default-signer' && 
      signerUuid !== 'mock-signer' &&
      signerUuid.length > 20

    if (!hasValidSigner || isDev) {
      console.log('Using mock funding cast response')
      return {
        hash: `mock-funding-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        success: true,
        cast: { text: castText }
      }
    }

    // Reply to the original loan cast
    const cast = await client.publishCast(signerUuid, castText, {
      replyTo: originalCastHash,
      embeds: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://loancast.app'}/explore`
        }
      ],
    })
    
    console.log('Funding cast created successfully:', cast.hash)
    return cast
  } catch (error) {
    console.error('Error creating funding cast:', error)
    return {
      hash: `failed-funding-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cast: { text: castText }
    }
  }
}

// Cast when a loan is repaid
export async function createRepaymentCast(
  signerUuid: string,
  loanId: string,
  originalCastHash: string,
  borrowerName: string,
  amount: number,
  onTime: boolean
) {
  const statusEmoji = onTime ? '✅' : '⚠️'
  const statusText = onTime ? 'ON TIME' : 'LATE'
  
  const castText = `${statusEmoji} ${loanId} repaid ${statusText}!

💸 ${borrowerName} repaid ${amount.toLocaleString()} USDC
📈 Lender earned their yield
🎯 Another successful trust-based transaction

${onTime ? '🏆 Perfect credit score!' : '📉 Credit score impact'}

#LoanCast #Repaid #TrustNetwork`

  try {
    const hasValidSigner = signerUuid && 
      signerUuid !== 'default-signer' && 
      signerUuid !== 'mock-signer' &&
      signerUuid.length > 20

    if (!hasValidSigner || isDev) {
      console.log('Using mock repayment cast response')
      return {
        hash: `mock-repayment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        success: true,
        cast: { text: castText }
      }
    }

    const cast = await client.publishCast(signerUuid, castText, {
      replyTo: originalCastHash,
      embeds: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://loancast.app'}/explore`
        }
      ],
    })
    
    console.log('Repayment cast created successfully:', cast.hash)
    return cast
  } catch (error) {
    console.error('Error creating repayment cast:', error)
    return {
      hash: `failed-repayment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cast: { text: castText }
    }
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

// Validate that a signer UUID belongs to a specific FID
export async function validateSigner(signerUuid: string, expectedFid: number) {
  try {
    const signer = await client.lookupSigner(signerUuid)
    return signer.fid === expectedFid
  } catch (error) {
    console.error('Error validating signer:', error)
    return false
  }
}