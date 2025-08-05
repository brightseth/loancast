import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Simple admin check - in production, validate JWT or API key
    const { data: loans, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(loans)
  } catch (error) {
    console.error('Error fetching loans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}