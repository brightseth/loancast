const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!

interface PostCastParams {
  text: string
  signerUuid: string
  parentUrl?: string
  embeds?: Array<{ url: string }>
}

export async function postCast({
  text,
  signerUuid,
  parentUrl,
  embeds = []
}: PostCastParams) {
  try {
    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': NEYNAR_API_KEY
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text,
        parent: parentUrl,
        embeds
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Neynar post error:', error)
      throw new Error(`Failed to post cast: ${error.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.cast
  } catch (error) {
    console.error('Error posting to Farcaster:', error)
    throw error
  }
}

export function formatLoanCast({
  amount,
  durationMonths,
  dueDate,
  yieldPercent
}: {
  amount: number
  durationMonths: number
  dueDate: Date
  yieldPercent: number
}) {
  const repayAmount = amount * (1 + yieldPercent / 100)
  const dueDateStr = dueDate.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
  
  const netAmount = amount * 0.9 // After 10% Farcaster fee
  
  return `┏━━━━ 💰 LOAN REQUEST ━━━━┓

🏦 Borrow ≤ ${amount.toLocaleString()} USDC
📅 ${durationMonths * 30} days • due ${dueDateStr}
📈 Yield ${yieldPercent}% → repay ${repayAmount.toFixed(0)} USDC
🎯 Highest bid = lender
💰 I eat Farcaster's 10% (get ${netAmount.toFixed(0)} USDC)
⚠️ This cast *is* the note

Cast on @loancast

┗━━━━━━━━━━━━━━━━━━━━━┛`
}