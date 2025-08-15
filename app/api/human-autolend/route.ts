import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { getHumanSession } from '@/lib/auth/humanSession'

const AutolendPrefsSchema = z.object({
  active: z.boolean(),
  min_score: z.number().int().min(0).max(100).optional(),
  max_amount_usdc: z.number().min(1).max(10000).optional(),
  max_duration_days: z.number().int().min(1).max(90).optional(),
  allow_human: z.boolean().optional(),
  allow_agent: z.boolean().optional(),
  daily_limit_usdc: z.number().min(1).max(50000).optional(),
  per_borrower_limit_usdc: z.number().min(1).max(5000).optional()
})

export async function GET(req: NextRequest) {
  try {
    const session = await getHumanSession(req)
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createServerClient()
    const { data: prefs, error } = await db
      .from('human_autolend_prefs')
      .select('*')
      .eq('lender_fid', session.fid)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching autolend prefs:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Return default preferences if none exist
    const defaultPrefs = {
      lender_fid: session.fid,
      active: false,
      min_score: 50,
      max_amount_usdc: 100,
      max_duration_days: 30,
      allow_human: true,
      allow_agent: false,
      daily_limit_usdc: 500,
      per_borrower_limit_usdc: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(prefs || defaultPrefs)
  } catch (error) {
    console.error('Error in human autolend GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (process.env.HUMAN_AUTOLEND_ENABLED !== 'true') {
      return NextResponse.json({ error: 'Human autolend disabled' }, { status: 403 })
    }

    const session = await getHumanSession(req)
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const prefs = AutolendPrefsSchema.parse(body)

    const db = createServerClient()
    
    // Upsert preferences
    const { data, error } = await db
      .from('human_autolend_prefs')
      .upsert({
        lender_fid: session.fid,
        ...prefs,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'lender_fid'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating autolend prefs:', error)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in human autolend PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getHumanSession(req)
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createServerClient()
    const { error } = await db
      .from('human_autolend_prefs')
      .delete()
      .eq('lender_fid', session.fid)

    if (error) {
      console.error('Error deleting autolend prefs:', error)
      return NextResponse.json({ error: 'Failed to delete preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in human autolend DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}