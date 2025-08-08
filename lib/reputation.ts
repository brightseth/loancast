import { supabaseAdmin } from './supabase'
import { getUserByFid } from './neynar'

// Badge definitions as outlined in the plan
export enum Badge {
  FIRST_ON_TIME_REPAY = 'first_on_time_repay',
  THREE_STREAK = '3_streak',
  TEN_STREAK = '10_streak',
  DEFAULTED_ONCE = 'defaulted_once', // permanent
  FUNDED_5 = 'funded_5',
  FUNDED_20 = 'funded_20'
}

// Max loan tiers tied to score
export const LOAN_CAPS = {
  FIRST_TIME: 200,    // $200 for new borrowers
  TIER_1: 400,        // $400 after proving reliability
  TIER_2: 700,        // $700 for good borrowers  
  TIER_3: 1000        // $1000 maximum
}

// Score change deltas as specified
export const SCORE_DELTAS = {
  ON_TIME_REPAY: 60,
  DEFAULT: -200,
  LATE_BUT_REPAID: -60
}

interface UserReputation {
  fid: string
  score: number
  maxLoanAmount: number
  badges: Badge[]
  accountAge: number
  followerCount: number
  totalLoans: number
  repaidLoans: number
  defaultedLoans: number
  repaymentStreak: number
  lastScoreChange: number
  lastScoreChangeReason: string
}

/**
 * Calculate reputation score for a user
 * Formula: 200 (base) + f(account_age) + g(repaid_loans, total_loans) + h(fid_followers)
 */
export async function calculateReputationScore(fid: string): Promise<UserReputation> {
  try {
    // Get user data from our database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('fid', fid)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      // Return default reputation for new user
      return getDefaultReputation(fid)
    }

    // Get Farcaster profile data for follower count and account age
    const farcasterUser = await getUserByFid(parseInt(fid))
    
    // Use reasonable defaults since we don't always have complete Neynar data
    const accountAge = 30 // Default to 30 days for existing users
    const followerCount = farcasterUser?.follower_count || 0

    // Calculate components
    const baseScore = 200
    const accountAgeScore = Math.min(accountAge * 0.5, 100) // Max 100 points for age
    const repaymentRateScore = userData.total_loans > 0 
      ? (userData.loans_repaid / userData.total_loans) * 300
      : 0
    const followerScore = Math.min(Math.sqrt(followerCount) * 2, 100) // Max 100 points for followers
    const streakBonus = Math.min(userData.repayment_streak * 10, 100)

    // Calculate total score
    let totalScore = Math.round(
      baseScore + 
      accountAgeScore + 
      repaymentRateScore + 
      followerScore + 
      streakBonus
    )

    // Apply penalties for defaults
    totalScore -= userData.loans_defaulted * 200

    // Ensure score stays within bounds
    totalScore = Math.max(0, Math.min(1000, totalScore))

    // Calculate max loan amount based on score
    const maxLoanAmount = getMaxLoanAmount(totalScore, userData.total_loans)

    // Calculate badges
    const badges = calculateBadges(userData, farcasterUser)

    return {
      fid,
      score: totalScore,
      maxLoanAmount,
      badges,
      accountAge,
      followerCount,
      totalLoans: userData.total_loans || 0,
      repaidLoans: userData.loans_repaid || 0,
      defaultedLoans: userData.loans_defaulted || 0,
      repaymentStreak: userData.repayment_streak || 0,
      lastScoreChange: userData.last_score_change || 0,
      lastScoreChangeReason: userData.last_score_change_reason || ''
    }

  } catch (error) {
    console.error('Error calculating reputation:', error)
    return getDefaultReputation(fid)
  }
}

/**
 * Get default reputation for new users
 */
function getDefaultReputation(fid: string): UserReputation {
  return {
    fid,
    score: 200, // Base score
    maxLoanAmount: LOAN_CAPS.FIRST_TIME, // $200 cap for first-time borrowers
    badges: [],
    accountAge: 0,
    followerCount: 0,
    totalLoans: 0,
    repaidLoans: 0,
    defaultedLoans: 0,
    repaymentStreak: 0,
    lastScoreChange: 0,
    lastScoreChangeReason: ''
  }
}

/**
 * Determine max loan amount based on score and loan history
 */
function getMaxLoanAmount(score: number, totalLoans: number): number {
  // First-time borrowers get $200 cap regardless of score
  if (totalLoans === 0) {
    return LOAN_CAPS.FIRST_TIME
  }

  // Progressive unlocks based on score
  if (score >= 800) return LOAN_CAPS.TIER_3 // $1000
  if (score >= 600) return LOAN_CAPS.TIER_2 // $700
  if (score >= 400) return LOAN_CAPS.TIER_1 // $400
  
  return LOAN_CAPS.FIRST_TIME // $200 fallback
}

/**
 * Calculate badges for a user
 */
function calculateBadges(userData: any, farcasterUser: any): Badge[] {
  const badges: Badge[] = []

  // Repayment badges
  if (userData.loans_repaid >= 1) {
    badges.push(Badge.FIRST_ON_TIME_REPAY)
  }
  
  if (userData.repayment_streak >= 3) {
    badges.push(Badge.THREE_STREAK)
  }
  
  if (userData.repayment_streak >= 10) {
    badges.push(Badge.TEN_STREAK)
  }

  // Default badge (permanent)
  if (userData.loans_defaulted > 0) {
    badges.push(Badge.DEFAULTED_ONCE)
  }

  // Lender badges (TODO: add lender tracking)
  // if (userData.loans_funded >= 5) badges.push(Badge.FUNDED_5)
  // if (userData.loans_funded >= 20) badges.push(Badge.FUNDED_20)

  return badges
}

/**
 * Update user reputation after a loan event
 */
export async function updateReputationAfterEvent(
  fid: string, 
  eventType: 'repay_on_time' | 'repay_late' | 'default',
  explanation: string
): Promise<UserReputation> {
  try {
    // Get current reputation
    const currentRep = await calculateReputationScore(fid)
    
    // Calculate score change
    let scoreChange = 0
    let reason = explanation
    
    switch (eventType) {
      case 'repay_on_time':
        scoreChange = SCORE_DELTAS.ON_TIME_REPAY
        reason = `+${scoreChange}: On-time repayment`
        break
      case 'repay_late':
        scoreChange = SCORE_DELTAS.LATE_BUT_REPAID
        reason = `${scoreChange}: Late repayment`
        break
      case 'default':
        scoreChange = SCORE_DELTAS.DEFAULT
        reason = `${scoreChange}: Loan default`
        break
    }

    // Update user record with score change tracking
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        last_score_change: scoreChange,
        last_score_change_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('fid', fid)

    if (error) {
      console.error('Error updating reputation:', error)
    }

    // Recalculate and return new reputation
    const newRep = await calculateReputationScore(fid)
    
    console.log(`Reputation updated for FID ${fid}: ${currentRep.score} → ${newRep.score} (${reason})`)
    
    return newRep

  } catch (error) {
    console.error('Error updating reputation after event:', error)
    throw error
  }
}

/**
 * Get badge display info
 */
export function getBadgeInfo(badge: Badge): { name: string, icon: string, description: string } {
  const badgeInfo = {
    [Badge.FIRST_ON_TIME_REPAY]: {
      name: 'First Repayment',
      icon: '🎯',
      description: 'Completed first on-time repayment'
    },
    [Badge.THREE_STREAK]: {
      name: '3-Streak',
      icon: '🔥',
      description: '3 consecutive on-time repayments'
    },
    [Badge.TEN_STREAK]: {
      name: '10-Streak',
      icon: '⭐',
      description: '10 consecutive on-time repayments'
    },
    [Badge.DEFAULTED_ONCE]: {
      name: 'Default',
      icon: '⚠️',
      description: 'Has defaulted on a loan'
    },
    [Badge.FUNDED_5]: {
      name: 'Supporter',
      icon: '💝',
      description: 'Funded 5+ loans'
    },
    [Badge.FUNDED_20]: {
      name: 'Angel Lender',
      icon: '👼',
      description: 'Funded 20+ loans'
    }
  }

  return badgeInfo[badge] || { name: 'Unknown', icon: '❓', description: 'Unknown badge' }
}

/**
 * Check if user can request a loan of a given amount
 */
export async function canRequestLoan(fid: string, requestedAmount: number): Promise<{
  allowed: boolean
  reason?: string
  maxAmount: number
  currentScore: number
}> {
  try {
    const reputation = await calculateReputationScore(fid)
    
    if (requestedAmount <= reputation.maxLoanAmount) {
      return {
        allowed: true,
        maxAmount: reputation.maxLoanAmount,
        currentScore: reputation.score
      }
    }

    return {
      allowed: false,
      reason: `Requested $${requestedAmount} exceeds your limit of $${reputation.maxLoanAmount}. Complete more loans to unlock higher amounts.`,
      maxAmount: reputation.maxLoanAmount,
      currentScore: reputation.score
    }

  } catch (error) {
    console.error('Error checking loan eligibility:', error)
    return {
      allowed: false,
      reason: 'Unable to verify loan eligibility',
      maxAmount: LOAN_CAPS.FIRST_TIME,
      currentScore: 200
    }
  }
}

/**
 * Get leaderboard of top borrowers by reputation score
 */
export async function getReputationLeaderboard(limit = 10): Promise<UserReputation[]> {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('credit_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return []
    }

    const leaderboard = await Promise.all(
      users.map(user => calculateReputationScore(user.fid))
    )

    return leaderboard.sort((a, b) => b.score - a.score)

  } catch (error) {
    console.error('Error creating leaderboard:', error)
    return []
  }
}

/**
 * Export reputation data for public profile API
 */
export async function getPublicReputationData(fid: string) {
  const reputation = await calculateReputationScore(fid)
  
  return {
    fid,
    score: reputation.score,
    maxLoanAmount: reputation.maxLoanAmount,
    badges: reputation.badges.map(badge => getBadgeInfo(badge)),
    totalLoans: reputation.totalLoans,
    repaidLoans: reputation.repaidLoans,
    repaymentStreak: reputation.repaymentStreak,
    accountAge: reputation.accountAge
  }
}

// Export all functions and types
export type { UserReputation }