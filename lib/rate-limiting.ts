import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/loans': { requests: 10, window: 60 }, // 10 requests per minute
  '/api/repay': { requests: 5, window: 300 }, // 5 requests per 5 minutes
  '/api/webhooks': { requests: 100, window: 60 }, // 100 webhooks per minute
  'default': { requests: 30, window: 60 } // 30 requests per minute default
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  identifier: string
}

export async function checkRateLimit(
  request: NextRequest,
  endpoint?: string
): Promise<RateLimitResult> {
  // Get identifier (IP address or FID if authenticated)
  const identifier = getIdentifier(request)
  
  // Get rate limit config for endpoint
  const path = endpoint || new URL(request.url).pathname
  const config = findRateLimitConfig(path)
  
  const windowStart = new Date()
  windowStart.setSeconds(windowStart.getSeconds() - config.window)
  
  try {
    // Clean up old entries first
    await supabaseAdmin
      .from('rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString())
    
    // Get current count for this identifier and endpoint
    const { data: existing, error } = await supabaseAdmin
      .from('rate_limits')
      .select('count, window_start')
      .eq('identifier', identifier)
      .eq('endpoint', path)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') { // Not "no rows returned"
      console.error('Rate limit check error:', error)
      // Fail open - allow request if we can't check rate limit
      return {
        allowed: true,
        remaining: config.requests - 1,
        resetTime: new Date(Date.now() + config.window * 1000),
        identifier
      }
    }
    
    const now = new Date()
    let currentCount = 0
    
    if (existing) {
      currentCount = existing.count
      
      // Check if we're over the limit
      if (currentCount >= config.requests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(new Date(existing.window_start).getTime() + config.window * 1000),
          identifier
        }
      }
      
      // Increment existing counter
      await supabaseAdmin
        .from('rate_limits')
        .update({ count: currentCount + 1 })
        .eq('identifier', identifier)
        .eq('endpoint', path)
        .eq('window_start', existing.window_start)
    } else {
      // Create new rate limit entry
      await supabaseAdmin
        .from('rate_limits')
        .insert({
          identifier,
          endpoint: path,
          count: 1,
          window_start: now.toISOString()
        })
      
      currentCount = 1
    }
    
    return {
      allowed: true,
      remaining: config.requests - currentCount,
      resetTime: new Date(now.getTime() + config.window * 1000),
      identifier
    }
    
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime: new Date(Date.now() + config.window * 1000),
      identifier
    }
  }
}

function getIdentifier(request: NextRequest): string {
  // Try to get FID from authenticated user first
  const userFid = request.headers.get('x-user-fid')
  if (userFid) {
    return `fid:${userFid}`
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return `ip:${ip}`
}

function findRateLimitConfig(path: string): { requests: number; window: number } {
  // Find most specific matching config
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern === 'default') continue
    if (path.startsWith(pattern)) {
      return config
    }
  }
  
  return RATE_LIMITS.default
}

// Middleware helper for API routes
export function withRateLimit<T extends Function>(handler: T): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const rateLimitResult = await checkRateLimit(request)
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime.toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString(),
            'Retry-After': '60'
          }
        }
      )
    }
    
    // Add rate limit headers to response
    const response = await handler(request, ...args)
    
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toISOString())
    }
    
    return response
  }) as T
}

// Clean up old rate limit entries (call from cron)
export async function cleanupRateLimits(): Promise<number> {
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - 1) // Clean up entries older than 1 hour
  
  const { error, count } = await supabaseAdmin
    .from('rate_limits')
    .delete()
    .lt('window_start', cutoff.toISOString())
  
  if (error) {
    console.error('Rate limit cleanup error:', error)
    return 0
  }
  
  return count || 0
}