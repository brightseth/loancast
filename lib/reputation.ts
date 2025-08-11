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

export async function getUserReputation(fid: number): Promise<UserReputation | null> {
  try {
    // TODO: Replace with actual database queries
    // For now, return null to indicate no real data available
    // This will cause components to show "No reputation data available"
    
    // Example of what real implementation would look like:
    // const { data: loans } = await supabaseAdmin
    //   .from('loans')
    //   .select('*')
    //   .or(`borrower_fid.eq.${fid},lender_fid.eq.${fid}`)
    
    // const { data: user } = await supabaseAdmin
    //   .from('users')
    //   .select('*')
    //   .eq('fid', fid)
    //   .single()
    
    // Calculate real metrics from actual loan history
    
    return null // No fake data - show real message instead
  } catch (error) {
    console.error('Error fetching user reputation:', error)
    return null
  }
}