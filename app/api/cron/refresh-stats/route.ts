import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/error-handler'
import { refreshPlatformStats, performMaintenance } from '@/lib/database-utils'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Verify cron secret
    const cronSecret = request.headers.get('authorization')
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting database maintenance cron job...')
    
    try {
      // Refresh materialized view for platform statistics
      await refreshPlatformStats()
      console.log('✅ Platform stats refreshed')
      
      // Perform additional maintenance tasks
      const maintenanceResult = await performMaintenance()
      console.log('✅ Database maintenance completed:', maintenanceResult)
      
      // Log success to Sentry
      Sentry.addBreadcrumb({
        message: 'Database maintenance completed successfully',
        level: 'info',
        data: maintenanceResult
      })

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        operations: {
          statsRefreshed: true,
          maintenanceCompleted: true,
          details: maintenanceResult
        }
      })
    } catch (error) {
      console.error('❌ Database maintenance failed:', error)
      
      // Log error to Sentry
      Sentry.captureException(error)
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  }, { endpoint: 'GET /api/cron/refresh-stats' })
}

// Vercel cron configuration
// Add this to vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/refresh-stats",
//       "schedule": "0 */6 * * *"
//     }
//   ]
// }