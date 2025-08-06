import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notifications'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    const success = await notificationService.markAsRead(params.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}