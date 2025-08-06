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
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userFid) {
      return NextResponse.json(
        { error: 'user_fid is required' },
        { status: 400 }
      )
    }

    const notifications = await notificationService.getUserNotifications(
      parseInt(userFid),
      limit,
      offset
    )

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    const body = await request.json()
    const { user_fid, type, title, message, loan_id, metadata } = body

    if (!user_fid || !type || !title || !message) {
      return NextResponse.json(
        { error: 'user_fid, type, title, and message are required' },
        { status: 400 }
      )
    }

    const notification = await notificationService.createNotification(
      user_fid,
      type,
      title,
      message,
      loan_id,
      metadata
    )

    if (!notification) {
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}