import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserByFid } from '@/lib/neynar'
import { z } from 'zod'

const Params = z.object({ fid: z.string().regex(/^\d+$/) })

interface CreditScore {
  score: number
  tier: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  color: string
}

function calculateCreditScore(loans: any[]): CreditScore {
  if (loans.length === 0) {
    return { score: 50, tier: 'Fair', color: 'text-amber-600' }
  }

  let score = 50 // Base score
  const repaidLoans = loans.filter(loan => loan.status === 'repaid')
  const defaultedLoans = loans.filter(loan => loan.status === 'default')
  
  // Repayment rate (0-40 points)
  const repaymentRate = repaidLoans.length / loans.length
  score += Math.round(repaymentRate * 40)
  
  // On-time payments bonus (0-20 points)
  const onTimePayments = repaidLoans.filter(loan => {
    if (!loan.due_ts || !loan.updated_at) return false
    return new Date(loan.updated_at) <= new Date(loan.due_ts)
  })
  const onTimeRate = repaidLoans.length > 0 ? onTimePayments.length / repaidLoans.length : 0
  score += Math.round(onTimeRate * 20)
  
  // Volume bonus (0-15 points)
  const totalVolume = loans.reduce((sum, loan) => sum + (loan.gross_usdc || 0), 0)
  if (totalVolume > 1000) score += 15
  else if (totalVolume > 500) score += 10
  else if (totalVolume > 100) score += 5
  
  // Defaults penalty (-30 points per default)
  score -= defaultedLoans.length * 30
  
  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score))
  
  // Determine tier and color
  let tier: CreditScore['tier']
  let color: string
  
  if (score >= 80) {
    tier = 'Excellent'
    color = 'text-green-600'
  } else if (score >= 65) {
    tier = 'Good'
    color = 'text-blue-600'
  } else if (score >= 40) {
    tier = 'Fair'
    color = 'text-amber-600'
  } else {
    tier = 'Poor'
    color = 'text-red-600'
  }
  
  return { score, tier, color }
}

function calculateRepaymentStats(loans: any[]) {
  const repaidLoans = loans.filter(loan => loan.status === 'repaid')
  
  if (repaidLoans.length === 0) {
    return {
      repayment_streak: 0,
      avg_repayment_days: null,
      loans_defaulted: loans.filter(loan => loan.status === 'default').length
    }
  }
  
  // Calculate average repayment time
  const repaymentTimes = repaidLoans
    .filter(loan => loan.created_at && loan.updated_at)
    .map(loan => {
      const created = new Date(loan.created_at)
      const repaid = new Date(loan.updated_at)
      return Math.ceil((repaid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    })
  
  const avg_repayment_days = repaymentTimes.length > 0 
    ? repaymentTimes.reduce((a, b) => a + b, 0) / repaymentTimes.length 
    : null
  
  // Calculate repayment streak (consecutive repaid loans from most recent)
  let streak = 0
  const sortedLoans = [...loans].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  
  for (const loan of sortedLoans) {
    if (loan.status === 'repaid') {
      streak++
    } else if (loan.status === 'default') {
      break
    }
    // Continue streak for open/funded loans (don't break streak for pending loans)
  }
  
  return {
    repayment_streak: streak,
    avg_repayment_days,
    loans_defaulted: loans.filter(loan => loan.status === 'default').length
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const validated = Params.parse(params)
    const fid = parseInt(validated.fid)
    
    // Try to get user from Neynar (optional - may fail)
    let neynarUser = null
    try {
      neynarUser = await getUserByFid(fid)
    } catch (error) {
      console.log('Neynar lookup failed, using fallback data')
    }
    
    // Get user's loan history
    const { data: loans, error: loansError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .or(`borrower_fid.eq.${fid},lender_fid.eq.${fid}`)
      .order('created_at', { ascending: false })
    
    if (loansError) {
      console.error('Error fetching loans:', loansError)
      loans = []
    }

    // If user has no loans, return 404
    if (!loans || loans.length === 0) {
      return NextResponse.json(
        { error: 'User not found or no loans yet' },
        { status: 404 }
      )
    }
    
    // Separate borrowed and lent loans
    const borrowedLoans = loans?.filter(loan => loan.borrower_fid === fid) || []
    const lentLoans = loans?.filter(loan => loan.lender_fid === fid) || []
    
    // Calculate credit score and stats
    const creditScore = calculateCreditScore(borrowedLoans)
    const repaymentStats = calculateRepaymentStats(borrowedLoans)
    
    // Calculate totals
    const total_borrowed = borrowedLoans.reduce((sum, loan) => sum + (loan.gross_usdc || 0), 0)
    const total_lent = lentLoans.reduce((sum, loan) => sum + (loan.gross_usdc || 0), 0)
    const loans_repaid = borrowedLoans.filter(loan => loan.status === 'repaid').length
    
    // Determine power badge eligibility
    const power_badge = creditScore.score >= 80 && loans_repaid >= 3 && total_borrowed >= 500
    
    const profile = {
      fid: fid,
      username: neynarUser?.username || null,
      display_name: neynarUser?.display_name || `User ${fid}`,
      pfp_url: neynarUser?.pfp_url || null,
      bio: neynarUser?.profile?.bio || null,
      follower_count: neynarUser?.follower_count || 0,
      following_count: neynarUser?.following_count || 0,
      
      // Credit and reputation
      credit_score: creditScore.score,
      credit_tier: creditScore.tier,
      credit_color: creditScore.color,
      
      // Loan statistics
      total_loans: borrowedLoans.length,
      loans_repaid,
      total_borrowed,
      total_lent,
      
      // Reputation stats
      ...repaymentStats,
      power_badge,
      
      // Recent activity
      recent_loans: borrowedLoans.slice(0, 5),
      recent_lent: lentLoans.slice(0, 5)
    }
    
    return NextResponse.json(profile)
    
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}