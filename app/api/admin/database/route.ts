import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/error-handler'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import {
  getDatabaseStats,
  refreshPlatformStats,
  performHealthCheck,
  performMaintenance,
  getUserLoanSummary,
  getPlatformStats
} from '@/lib/database-utils'

export async function GET(request: NextRequest) {
  // Use auth rate limiter for admin endpoints
  const { result, response } = await withRateLimit(request, rateLimiters.auth)
  if (response) return response

  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'health'

    // Simple auth check - in production, implement proper admin authentication
    const adminKey = request.headers.get('x-admin-key')
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'health':
        const healthCheck = await performHealthCheck()
        return NextResponse.json(healthCheck)

      case 'stats':
        const stats = await getDatabaseStats()
        return NextResponse.json(stats)

      case 'platform-stats':
        const platformStats = await getPlatformStats()
        return NextResponse.json(platformStats)

      case 'user-summary':
        const fid = searchParams.get('fid')
        if (!fid) {
          return NextResponse.json(
            { error: 'FID parameter required' },
            { status: 400 }
          )
        }
        const userSummary = await getUserLoanSummary(parseInt(fid))
        return NextResponse.json(userSummary)

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  }, { endpoint: 'GET /api/admin/database' })
}

export async function POST(request: NextRequest) {
  // Use auth rate limiter for admin endpoints
  const { result, response } = await withRateLimit(request, rateLimiters.auth)
  if (response) return response

  return withErrorHandling(async () => {
    const { action } = await request.json()

    // Simple auth check - in production, implement proper admin authentication
    const adminKey = request.headers.get('x-admin-key')
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'refresh-stats':
        await refreshPlatformStats()
        return NextResponse.json({ message: 'Platform stats refreshed successfully' })

      case 'maintenance':
        const maintenanceResult = await performMaintenance()
        return NextResponse.json(maintenanceResult)

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  }, { endpoint: 'POST /api/admin/database' })
}