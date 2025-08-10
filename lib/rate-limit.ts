/**
 * Simple in-memory rate limiter for MVP
 * No database dependencies
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (resets on deploy)
const store = new Map<string, RateLimitEntry>()

// Clean old entries every minute
setInterval(() => {
  const now = Date.now()
  const entriesToDelete: string[] = []
  store.forEach((entry, key) => {
    if (entry.resetTime < now) {
      entriesToDelete.push(key)
    }
  })
  entriesToDelete.forEach(key => store.delete(key))
}, 60000)

export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const key = identifier
  
  const entry = store.get(key)
  
  if (!entry || entry.resetTime < now) {
    // New window
    store.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true, remaining: limit - 1 }
  }
  
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }
  
  // Increment count
  entry.count++
  store.set(key, entry)
  
  return { allowed: true, remaining: limit - entry.count }
}

// Higher-order function wrapper for API routes
export function withRateLimit(handler: Function, limit: number = 10, windowMs: number = 60000) {
  return async (req: Request, ...args: any[]) => {
    const identifier = req.headers.get('x-forwarded-for') || 'anonymous'
    const { allowed } = await checkRateLimit(identifier, limit, windowMs)
    
    if (!allowed) {
      return new Response('Rate limit exceeded', { status: 429 })
    }
    
    return handler(req, ...args)
  }
}

// Stub rate limiters (simplified for MVP)
export const rateLimiters = {
  api: () => ({ allowed: true, remaining: 99 }),
  feedback: () => ({ allowed: true, remaining: 99 }),
  strict: () => ({ allowed: true, remaining: 99 })
}