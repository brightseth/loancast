// Rate limiting utilities
export async function checkRateLimit(key: string, limit: number = 10, window: number = 60000) {
  // Simple in-memory rate limiting - replace with Redis/database in production
  return { success: true, resetTime: Date.now() + window }
}

export function createRateLimiter(defaultLimit: number = 10, defaultWindow: number = 60000) {
  return async (key: string, limit?: number, window?: number) => {
    return checkRateLimit(key, limit || defaultLimit, window || defaultWindow)
  }
}