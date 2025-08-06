import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { withErrorHandling, createApiError } from '@/lib/error-handler'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Check rate limit first - use readOnly limiter for public list
  const { result, response } = await withRateLimit(request, rateLimiters.readOnly)
  if (response) return response

  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('Fetching loans list with params:', { status, limit, offset })

    // Simple query fallback
    let query = supabaseAdmin
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Math.max(offset, 0), Math.max(offset, 0) + Math.min(limit, 100) - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: loans, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw createApiError(`Database error: ${error.message}`, 500, 'DATABASE_ERROR')
    }

    console.log(`Found ${loans?.length || 0} loans`)
    
    return NextResponse.json(loans || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      }
    })
  }, { endpoint: 'GET /api/loans/list' })
}