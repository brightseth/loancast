// Reputation system stub
export interface Badge {
  id: string
  name: string
  icon: string
  description: string
}

export function getBadgeInfo(badgeId: string): Badge {
  return {
    id: badgeId,
    name: 'Sample Badge',
    icon: '🏆',
    description: 'Sample badge description'
  }
}

export interface UserReputation {
  fid: number
  score: number
  successfulLoans: number
  totalLoans: number
  repaidLoans: number
  repaymentRate: number
  repaymentStreak: number
  mutualConnections: number
  maxLoanAmount: number
  accountAge: number
  followers: number
  following: number
  riskLevel: 'low' | 'medium' | 'high'
  badges: Badge[]
  [key: string]: any // Allow any other properties
}

export async function getUserReputation(fid: number): Promise<UserReputation> {
  // Generate mock reputation based on FID
  const score = Math.min(950, 600 + (fid % 350))
  const successfulLoans = Math.floor(fid % 25) + 1
  const totalLoans = successfulLoans + Math.floor(fid % 3)
  const repaidLoans = successfulLoans
  const repaymentRate = Math.min(100, 70 + (fid % 30))
  const repaymentStreak = Math.floor(fid % 12) + 1
  const mutualConnections = Math.floor(fid % 15) + 1
  const maxLoanAmount = Math.min(5000, 100 + (successfulLoans * 200))
  const accountAge = Math.floor(fid % 365) + 30
  const followers = Math.floor(fid % 1000) + 50
  const following = Math.floor(fid % 500) + 25
  const badges: Badge[] = successfulLoans > 10 ? [
    { id: 'trusted-lender', name: 'Trusted Lender', icon: '🏆', description: 'Completed 10+ loans' },
    { id: 'repayment-champion', name: 'Repayment Champion', icon: '💯', description: 'Perfect repayment streak' }
  ] : []
  
  let riskLevel: 'low' | 'medium' | 'high' = 'high'
  if (score >= 850 && repaymentRate >= 95) riskLevel = 'low'
  else if (score >= 750 && repaymentRate >= 85) riskLevel = 'medium'
  
  return {
    fid,
    score,
    successfulLoans,
    totalLoans,
    repaidLoans,
    repaymentRate,
    repaymentStreak,
    mutualConnections,
    maxLoanAmount,
    accountAge,
    followers,
    following,
    riskLevel,
    badges
  }
}