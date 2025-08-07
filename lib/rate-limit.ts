import { NextRequest } from 'next/server'

// In-memory store for development/fallback
const memoryStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  max: number // Maximum requests
  windowMs: number // Time window in milliseconds
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

// Default key generator uses IP address
const defaultKeyGenerator = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || '127.0.0.1'
  return `rate_limit:${ip}`
}

// Clean up expired entries from memory store
const cleanupMemoryStore = () => {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  memoryStore.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => memoryStore.delete(key))
}

export class RateLimiter {
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: defaultKeyGenerator,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    }
  }

  async checkLimit(req: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(req)
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    // Try to use Redis if available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      return this.checkLimitRedis(key, now)
    }
    
    // Fallback to in-memory store
    return this.checkLimitMemory(key, now)
  }

  private async checkLimitRedis(key: string, now: number): Promise<RateLimitResult> {
    try {
      // Use simple Redis implementation
      const redis = new (await import('@upstash/redis')).Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })

      const windowStart = now - this.config.windowMs
      const pipeline = redis.pipeline()
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart)
      // Add current request
      pipeline.zadd(key, { score: now, member: now.toString() })
      // Count requests in window
      pipeline.zcard(key)
      // Set expiration
      pipeline.expire(key, Math.ceil(this.config.windowMs / 1000))
      
      const results = await pipeline.exec()
      const count = results[2] as number

      const resetTime = now + this.config.windowMs
      const remaining = Math.max(0, this.config.max - count)

      return {
        success: count <= this.config.max,
        limit: this.config.max,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('Redis rate limit error, falling back to memory:', error)
      return this.checkLimitMemory(key, now)
    }
  }

  private checkLimitMemory(key: string, now: number): RateLimitResult {
    cleanupMemoryStore()
    
    const resetTime = now + this.config.windowMs
    const existing = memoryStore.get(key)

    if (!existing || now > existing.resetTime) {
      // New window
      memoryStore.set(key, { count: 1, resetTime })
      return {
        success: true,
        limit: this.config.max,
        remaining: this.config.max - 1,
        resetTime
      }
    }

    // Increment count
    existing.count++
    const remaining = Math.max(0, this.config.max - existing.count)

    return {
      success: existing.count <= this.config.max,
      limit: this.config.max,
      remaining,
      resetTime: existing.resetTime
    }
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Strict limits for sensitive operations
  loanCreation: new RateLimiter({
    max: 50, // 50 loan creations per 15 minutes (higher for testing)
    windowMs: 15 * 60 * 1000,
  }),

  // Moderate limits for API endpoints
  api: new RateLimiter({
    max: 100, // 100 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
  }),

  // Generous limits for read operations
  readOnly: new RateLimiter({
    max: 1000, // 1000 requests per hour
    windowMs: 60 * 60 * 1000,
  }),

  // Very strict for auth endpoints
  auth: new RateLimiter({
    max: 10, // 10 attempts per 5 minutes
    windowMs: 5 * 60 * 1000,
  }),
}

// Middleware helper
export async function withRateLimit(
  req: NextRequest,
  limiter: RateLimiter,
  onLimit?: () => Response
): Promise<{ result: RateLimitResult; response?: Response }> {
  const result = await limiter.checkLimit(req)
  
  if (!result.success) {
    const defaultResponse = new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      }
    )
    
    return {
      result,
      response: onLimit ? onLimit() : defaultResponse
    }
  }

  return { result }
}