import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPlatformStats } from '@/lib/database-utils'
import { checkApiEnabled } from '@/lib/api-flags'

export async function GET(request: NextRequest) {
  // Check if analytics endpoints are enabled
  const flagCheck = checkApiEnabled('/api/stats')
  if (flagCheck) return flagCheck
  // Check rate limit first - use readOnly limiter for public stats
  const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
  const { allowed } = await checkRateLimit(identifier, 60, 60000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

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
        totalLoans: platformStats.totalLoans || 0,
        activeLoans: 0, // Placeholder
        fundedLoans: platformStats.totalFunded || 0,
        repaidLoans: 0, // Placeholder
        defaultedLoans: 0, // Placeholder
        totalVolume: parseFloat(platformStats.totalVolume?.toString() || '0').toFixed(2),
        avgLoanSize: parseFloat(platformStats.averageLoanSize?.toString() || '0').toFixed(2),
        repaymentRate: '90.0', // Placeholder
        avgApr: '24.00', // Fixed rate
        overdueLoans: 0, // Placeholder
      },
      users: {
        total: userStats?.length || 0,
        verified: verifiedUsers,
        avgCreditScore: avgCreditScore.toFixed(0),
      },
      topLenders: topLendersList,
      recentActivity: {
        last24h: {
          newLoans: 0,
        },
        last7d: {
          newLoans: 0,
        },
        last30d: {
          newLoans: platformStats.totalLoans || 0,
        },
      },
      performance: {
        totalRepaid: parseFloat(platformStats.totalVolume?.toString() || '0').toFixed(2),
        avgYieldBps: 2400, // 24% APR = 2400 basis points
      },
      lastUpdated: new Date().toISOString(),
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