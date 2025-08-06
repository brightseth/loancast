import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { getPlatformStats } from '@/lib/database-utils'

export async function GET(request: NextRequest) {
  // Check rate limit first - use readOnly limiter for public stats
  const { result, response } = await withRateLimit(request, rateLimiters.readOnly)
  if (response) return response

  try {
    // Use optimized materialized view for platform stats
    const platformStats = await getPlatformStats()
    
    // Get additional user stats (lightweight query)
    const { data: userStats } = await supabaseAdmin
      .from('users')
      .select('credit_score, verified_wallet')
      .not('credit_score', 'is', null)

    // Calculate derived user metrics
    const avgCreditScore = userStats 
      ? userStats.reduce((sum, u) => sum + (u.credit_score || 0), 0) / userStats.length
      : 0
    const verifiedUsers = userStats?.filter(u => u.verified_wallet).length || 0

    // Get top lenders (cached query with limit)
    const { data: topLenders } = await supabaseAdmin
      .from('loans')
      .select('lender_fid, gross_usdc')
      .not('lender_fid', 'is', null)
      .not('gross_usdc', 'is', null)
      .order('gross_usdc', { ascending: false })
      .limit(50) // Process only top loans for efficiency
    
    // Process top lenders efficiently
    const lenderMap = new Map()
    topLenders?.forEach(loan => {
      const fid = loan.lender_fid
      if (!lenderMap.has(fid)) {
        lenderMap.set(fid, { fid, count: 0, volume: 0 })
      }
      const lender = lenderMap.get(fid)
      lender.count++
      lender.volume += loan.gross_usdc || 0
    })

    const topLendersList = Array.from(lenderMap.values())
      .sort((a: any, b: any) => b.volume - a.volume)
      .slice(0, 10)

    const stats = {
      overview: {
        totalLoans: platformStats.total_loans,
        activeLoans: platformStats.active_loans,
        fundedLoans: platformStats.funded_loans,
        repaidLoans: platformStats.repaid_loans,
        defaultedLoans: platformStats.defaulted_loans,
        totalVolume: parseFloat(platformStats.total_volume || '0').toFixed(2),
        avgLoanSize: parseFloat(platformStats.avg_loan_size || '0').toFixed(2),
        repaymentRate: parseFloat(platformStats.repayment_rate || '0').toFixed(1),
        avgApr: (parseFloat(platformStats.avg_yield_bps || '0') / 100).toFixed(2),
        overdueLoans: platformStats.overdue_loans,
      },
      users: {
        total: userStats?.length || 0,
        verified: verifiedUsers,
        avgCreditScore: avgCreditScore.toFixed(0),
      },
      topLenders: topLendersList,
      recentActivity: {
        last24h: {
          newLoans: platformStats.loans_24h,
        },
        last7d: {
          newLoans: platformStats.loans_7d,
        },
        last30d: {
          newLoans: platformStats.loans_30d,
        },
      },
      performance: {
        totalRepaid: parseFloat(platformStats.total_repaid || '0').toFixed(2),
        avgYieldBps: Math.round(platformStats.avg_yield_bps || 0),
      },
      lastUpdated: platformStats.updated_at,
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}