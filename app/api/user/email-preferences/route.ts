import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
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

    const { data, error } = await supabase
      .from('user_email_preferences')
      .select('*')
      .eq('user_fid', parseInt(userFid))
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    // Return default preferences if none found
    const preferences = data || {
      user_fid: parseInt(userFid),
      email: null,
      email_verified: false,
      payment_reminders: true,
      loan_funded: true,
      loan_repaid: true,
      loan_defaulted: true,
      marketing: false,
      reminder_3day: true,
      reminder_1day: true,
      reminder_overdue: true
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching email preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    const body = await request.json()
    const { user_fid, email, ...preferences } = body

    if (!user_fid) {
      return NextResponse.json(
        { error: 'user_fid is required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const updateData = {
      user_fid: parseInt(user_fid),
      ...preferences,
      updated_at: new Date().toISOString()
    }

    // If email is being set, mark as unverified
    if (email !== undefined) {
      updateData.email = email
      updateData.email_verified = false
      updateData.email_verified_at = null
    }

    const { data, error } = await supabase
      .from('user_email_preferences')
      .upsert(updateData)
      .select()
      .single()

    if (error) {
      console.error('Error updating preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating email preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}