import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { withErrorHandling, createApiError } from '@/lib/error-handler'
import { getOptimizedLoans } from '@/lib/database-utils'

export async function GET(request: NextRequest) {
  // Check rate limit first - use readOnly limiter for public list
  const { result, response } = await withRateLimit(request, rateLimiters.readOnly)
  if (response) return response

  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use optimized database function
    const loans = await getOptimizedLoans({
      status,
      limit: Math.min(limit, 100), // Cap at 100
      offset: Math.max(offset, 0)
    })
    
    return NextResponse.json(loans || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      }
    })
  }, { endpoint: 'GET /api/loans/list' })
}