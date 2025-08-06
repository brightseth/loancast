import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notifications'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  // Rate limiting
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    const searchParams = request.nextUrl.searchParams
    const userFid = searchParams.get('user_fid')

    if (!userFid) {
      return NextResponse.json(
        { error: 'user_fid is required' },
        { status: 400 }
      )
    }

    const count = await notificationService.getUnreadCount(parseInt(userFid))

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
}