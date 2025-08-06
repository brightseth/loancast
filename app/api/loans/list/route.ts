import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: loans, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch loans', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(loans || [])
  } catch (error) {
    console.error('List loans error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}