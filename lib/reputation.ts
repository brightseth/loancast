import { supabase } from './supabase'

export interface ReputationBadge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  requirement: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
}

export interface UserReputation {
  user_fid: number
  credit_score: number
  total_loans: number
  loans_repaid: number
  loans_defaulted: number
  total_borrowed: number
  total_lent: number
  repayment_streak: number
  avg_repayment_days: number | null
  earliest_loan: string | null
  badges: ReputationBadge[]
  reputation_tier: 'newcomer' | 'trusted' | 'veteran' | 'elite' | 'legendary'
  trust_score: number
}

// Available reputation badges
export const REPUTATION_BADGES: ReputationBadge[] = [
  // Repayment Badges
  {
    id: 'first_repayment',
    name: 'First Repayment',
    description: 'Successfully repaid your first loan',
    icon: '🎯',
    color: 'bg-blue-100 text-blue-800',
    requirement: 'Repay 1 loan',
    rarity: 'common'
  },
  {
    id: 'perfect_five',
    name: 'Perfect Five',
    description: 'Repaid 5 loans on time',
    icon: '⭐',
    color: 'bg-yellow-100 text-yellow-800',
    requirement: 'Repay 5 loans on time',
    rarity: 'uncommon'
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: '10+ consecutive on-time repayments',
    icon: '🔥',
    color: 'bg-orange-100 text-orange-800',
    requirement: '10+ loan streak',
    rarity: 'rare'
  },
  {
    id: 'never_late',
    name: 'Never Late',
    description: '25+ loans, never missed a deadline',
    icon: '💎',
    color: 'bg-purple-100 text-purple-800',
    requirement: '25+ loans, 100% on time',
    rarity: 'legendary'
  },

  // Volume Badges
  {
    id: 'big_borrower',
    name: 'Big Borrower',
    description: 'Borrowed over $10,000 total',
    icon: '💰',
    color: 'bg-green-100 text-green-800',
    requirement: '$10,000+ borrowed',
    rarity: 'uncommon'
  },
  {
    id: 'whale',
    name: 'Whale',
    description: 'Borrowed over $100,000 total',
    icon: '🐋',
    color: 'bg-indigo-100 text-indigo-800',
    requirement: '$100,000+ borrowed',
    rarity: 'legendary'
  },

  // Lending Badges
  {
    id: 'generous_lender',
    name: 'Generous Lender',
    description: 'Funded 10+ loans for others',
    icon: '🤝',
    color: 'bg-emerald-100 text-emerald-800',
    requirement: 'Fund 10+ loans',
    rarity: 'rare'
  },
  {
    id: 'community_bank',
    name: 'Community Bank',
    description: 'Lent over $50,000 to others',
    icon: '🏦',
    color: 'bg-slate-100 text-slate-800',
    requirement: '$50,000+ lent',
    rarity: 'legendary'
  },

  // Time-based Badges
  {
    id: 'og_member',
    name: 'OG Member',
    description: 'One of the first 1000 LoanCast users',
    icon: '👑',
    color: 'bg-amber-100 text-amber-800',
    requirement: 'Early adopter',
    rarity: 'rare'
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Active for 6+ months',
    icon: '🛡️',
    color: 'bg-gray-100 text-gray-800',
    requirement: '6+ months active',
    rarity: 'uncommon'
  },

  // Social Badges
  {
    id: 'influencer',
    name: 'Influencer',
    description: '10,000+ Farcaster followers',
    icon: '📱',
    color: 'bg-pink-100 text-pink-800',
    requirement: '10k+ FC followers',
    rarity: 'rare'
  },
  {
    id: 'verified',
    name: 'Verified',
    description: 'Verified Farcaster account',
    icon: '✅',
    color: 'bg-blue-100 text-blue-800',
    requirement: 'FC verification',
    rarity: 'common'
  }
]

class ReputationService {
  // Calculate base credit score (0-1000)
  calculateCreditScore(stats: {
    totalLoans: number
    loansRepaid: number
    loansDefaulted: number
    repaymentStreak: number
    avgRepaymentDays: number | null
    followerCount: number
    accountAge: number // in months
  }): number {
    let score = 500 // Start at 500

    // Repayment history (40% weight)
    const repaymentRate = stats.totalLoans > 0 ? stats.loansRepaid / stats.totalLoans : 0
    score += repaymentRate * 200 // +0-200 points

    // Default penalty
    score -= stats.loansDefaulted * 100 // -100 per default

    // Streak bonus (20% weight)
    score += Math.min(stats.repaymentStreak * 10, 100) // +0-100 points

    // Early repayment bonus (15% weight)
    if (stats.avgRepaymentDays !== null && stats.avgRepaymentDays < 0) {
      score += Math.abs(stats.avgRepaymentDays) * 2 // Bonus for early repayment
    }

    // Social factors (15% weight)
    score += Math.min(Math.log10(stats.followerCount + 1) * 20, 60) // +0-60 points
    score += Math.min(stats.accountAge * 5, 40) // +0-40 points for account age

    // Experience bonus (10% weight)
    score += Math.min(stats.totalLoans * 5, 50) // +0-50 points

    return Math.max(0, Math.min(1000, Math.round(score)))
  }

  // Calculate trust score (0-100)
  calculateTrustScore(creditScore: number, socialScore: number): number {
    const normalizedCredit = creditScore / 1000 * 70 // 70% weight
    const normalizedSocial = Math.min(socialScore / 100, 1) * 30 // 30% weight
    return Math.round(normalizedCredit + normalizedSocial)
  }

  // Determine reputation tier
  getReputationTier(creditScore: number, totalLoans: number): UserReputation['reputation_tier'] {
    if (creditScore >= 900 && totalLoans >= 50) return 'legendary'
    if (creditScore >= 800 && totalLoans >= 20) return 'elite'
    if (creditScore >= 700 && totalLoans >= 10) return 'veteran'
    if (creditScore >= 600 && totalLoans >= 3) return 'trusted'
    return 'newcomer'
  }

  // Check which badges a user has earned
  calculateEarnedBadges(stats: {
    totalLoans: number
    loansRepaid: number
    loansDefaulted: number
    totalBorrowed: number
    totalLent: number
    repaymentStreak: number
    accountAge: number
    followerCount: number
    isVerified: boolean
    userNumber: number // Position in user creation order
  }): ReputationBadge[] {
    const earnedBadges: ReputationBadge[] = []

    // Repayment badges
    if (stats.loansRepaid >= 1) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'first_repayment')!)
    }
    if (stats.loansRepaid >= 5 && stats.loansDefaulted === 0) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'perfect_five')!)
    }
    if (stats.repaymentStreak >= 10) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'streak_master')!)
    }
    if (stats.totalLoans >= 25 && stats.loansDefaulted === 0) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'never_late')!)
    }

    // Volume badges
    if (stats.totalBorrowed >= 10000) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'big_borrower')!)
    }
    if (stats.totalBorrowed >= 100000) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'whale')!)
    }

    // Lending badges
    if (stats.totalLent >= 10) { // 10+ loans funded
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'generous_lender')!)
    }
    if (stats.totalLent >= 50000) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'community_bank')!)
    }

    // Time-based badges
    if (stats.userNumber <= 1000) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'og_member')!)
    }
    if (stats.accountAge >= 6) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'veteran')!)
    }

    // Social badges
    if (stats.followerCount >= 10000) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'influencer')!)
    }
    if (stats.isVerified) {
      earnedBadges.push(REPUTATION_BADGES.find(b => b.id === 'verified')!)
    }

    return earnedBadges.filter(Boolean)
  }

  // Get comprehensive user reputation
  async getUserReputation(userFid: number): Promise<UserReputation | null> {
    try {
      // Fallback to simple queries for now
      const { data: borrowedLoans } = await supabase
        .from('loans')
        .select('*')
        .eq('borrower_fid', userFid)

      const { data: lentLoans } = await supabase
        .from('loans')
        .select('*')
        .eq('lender_fid', userFid)

      const borrowed = borrowedLoans || []
      const lent = lentLoans || []

      const totalLoans = borrowed.length
      const loansRepaid = borrowed.filter(l => l.status === 'repaid').length
      const loansDefaulted = borrowed.filter(l => l.status === 'defaulted').length
      const totalBorrowed = borrowed.filter(l => l.status === 'repaid').reduce((sum, l) => sum + (l.repay_usdc || 0), 0)
      const totalLent = lent.length

      // Calculate repayment streak (simplified)
      const recentLoans = borrowed.sort((a, b) => new Date(b.due_ts).getTime() - new Date(a.due_ts).getTime())
      let repaymentStreak = 0
      for (const loan of recentLoans) {
        if (loan.status === 'repaid') {
          repaymentStreak++
        } else if (loan.status === 'defaulted') {
          break
        }
      }

      // Calculate average repayment days
      const repaidLoans = borrowed.filter(l => l.status === 'repaid' && l.repaid_at)
      let avgRepaymentDays = null
      if (repaidLoans.length > 0) {
        const totalDays = repaidLoans.reduce((sum, loan) => {
          const dueDate = new Date(loan.due_ts)
          const repaidDate = new Date(loan.repaid_at!)
          const daysDiff = (repaidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          return sum + daysDiff
        }, 0)
        avgRepaymentDays = totalDays / repaidLoans.length
      }

      const stats = {
        totalLoans,
        loansRepaid,
        loansDefaulted,
        totalBorrowed,
        totalLent,
        repaymentStreak,
        avgRepaymentDays,
        accountAge: 1, // Assume 1 month for now
        followerCount: 100, // Default follower count
        isVerified: false,
        userNumber: userFid
      }

      // Calculate scores
      const creditScore = this.calculateCreditScore({
        ...stats,
        followerCount: stats.followerCount,
        accountAge: stats.accountAge
      })

      const socialScore = Math.min(Math.log10(stats.followerCount + 1) * 10 + (stats.isVerified ? 20 : 0), 100)
      const trustScore = this.calculateTrustScore(creditScore, socialScore)
      const reputationTier = this.getReputationTier(creditScore, stats.totalLoans)
      const badges = this.calculateEarnedBadges(stats)

      return {
        user_fid: userFid,
        credit_score: creditScore,
        total_loans: stats.totalLoans,
        loans_repaid: stats.loansRepaid,
        loans_defaulted: stats.loansDefaulted,
        total_borrowed: stats.totalBorrowed,
        total_lent: stats.totalLent,
        repayment_streak: stats.repaymentStreak,
        avg_repayment_days: stats.avgRepaymentDays,
        earliest_loan: borrowed.length > 0 ? borrowed.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0].created_at : null,
        badges,
        reputation_tier: reputationTier,
        trust_score: trustScore
      }
    } catch (error) {
      console.error('Error calculating user reputation:', error)
      return null
    }
  }

  // Get reputation color scheme
  getReputationColors(tier: UserReputation['reputation_tier']): {
    bg: string
    text: string
    border: string
  } {
    switch (tier) {
      case 'legendary':
        return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' }
      case 'elite':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' }
      case 'veteran':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' }
      case 'trusted':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    }
  }

  // Get tier display info
  getTierInfo(tier: UserReputation['reputation_tier']): {
    name: string
    icon: string
    description: string
  } {
    switch (tier) {
      case 'legendary':
        return {
          name: 'Legendary',
          icon: '👑',
          description: 'Master of trust-based lending with exceptional track record'
        }
      case 'elite':
        return {
          name: 'Elite',
          icon: '⭐',
          description: 'Highly trusted member with excellent repayment history'
        }
      case 'veteran':
        return {
          name: 'Veteran',
          icon: '🛡️',
          description: 'Experienced borrower with solid reputation'
        }
      case 'trusted':
        return {
          name: 'Trusted',
          icon: '✅',
          description: 'Reliable member with proven track record'
        }
      default:
        return {
          name: 'Newcomer',
          icon: '🌱',
          description: 'New to LoanCast, building reputation'
        }
    }
  }
}

export const reputationService = new ReputationService()