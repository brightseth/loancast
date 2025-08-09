import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import * as Sentry from '@sentry/nextjs'
import { checkApiEnabled } from '@/lib/api-flags'

export async function POST(request: NextRequest) {
  // Check if feedback endpoints are enabled
  const flagCheck = checkApiEnabled('/api/feedback')
  if (flagCheck) return flagCheck
  // Check rate limit first
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    const body = await request.json()
    const { type, feedback, location, userAgent, url, timestamp } = body

    if (!feedback || !feedback.trim()) {
      return NextResponse.json(
        { error: 'Feedback is required' },
        { status: 400 }
      )
    }

    // Store feedback in database
    const feedbackData = {
      type: type || 'general',
      feedback: feedback.trim(),
      location: location || 'unknown',
      user_agent: userAgent,
      page_url: url,
      created_at: timestamp || new Date().toISOString(),
      status: 'new'
    }

    const { error } = await supabaseAdmin
      .from('feedback')
      .insert(feedbackData)

    if (error) {
      console.error('Error storing feedback:', error)
      // Don't fail the request if database storage fails
      // Fall back to logging
    }

    // Also send to Sentry for bug reports
    if (type === 'bug') {
      Sentry.addBreadcrumb({
        category: 'user-feedback',
        message: 'Bug report submitted',
        data: {
          feedback: feedback.substring(0, 100), // Truncate for privacy
          location,
          url
        }
      })
      
      Sentry.captureMessage('User Bug Report', 'warning')
    }

    // Log all feedback for monitoring
    console.log('Feedback submitted:', {
      type,
      location,
      feedback: feedback.substring(0, 100) + (feedback.length > 100 ? '...' : ''),
      timestamp
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Feedback API error:', error)
    Sentry.captureException(error)
    
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}