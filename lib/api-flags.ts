/**
 * API endpoint feature flags for MVP
 * Returns 503 response for disabled endpoints
 */
import { NextResponse } from 'next/server'
import { FLAGS } from './flags'

export function checkApiEnabled(endpoint: string) {
  // Core endpoints that are always enabled
  const coreEndpoints = [
    '/api/loans',           // Create/list loans
    '/api/loans/[id]',      // Get/update loan details  
    '/api/loans/[id]/fund', // Fund a loan
    '/api/repay',           // Repay loan endpoints
    '/api/auth/neynar'      // Authentication
  ]

  // Admin endpoints
  if (endpoint.startsWith('/api/admin/')) {
    if (!FLAGS.ADMIN_DASHBOARD) {
      return NextResponse.json(
        { error: 'Admin endpoints disabled for MVP stability' },
        { status: 503 }
      )
    }
  }

  // Cron job endpoints
  if (endpoint.startsWith('/api/cron/')) {
    if (!FLAGS.CRON_JOBS) {
      return NextResponse.json(
        { error: 'Cron jobs disabled for MVP stability' },
        { status: 503 }
      )
    }
  }

  // Analytics/stats endpoints
  if (endpoint.includes('/stats') || endpoint.includes('/analytics')) {
    if (!FLAGS.ANALYTICS) {
      return NextResponse.json(
        { error: 'Analytics disabled for MVP stability' },
        { status: 503 }
      )
    }
  }

  // Feedback endpoints
  if (endpoint.includes('/feedback')) {
    if (!FLAGS.FEEDBACK) {
      return NextResponse.json(
        { error: 'Feedback disabled for MVP stability' },
        { status: 503 }
      )
    }
  }

  // All other endpoints pass through
  return null
}