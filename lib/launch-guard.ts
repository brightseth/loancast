import { NextResponse } from 'next/server'

/**
 * Guards test endpoints behind launch flag
 * Returns 404 in production, allows in development
 */
export function guardTestEndpoint() {
  if (process.env.LAUNCH === 'true' || process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint disabled in production' },
      { status: 404 }
    )
  }
  return null // Allow in development
}