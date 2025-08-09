import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Try minimal select first
    const { data, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        code: error.code
      })
    }

    return NextResponse.json({
      success: true,
      sampleLoan: data[0] || null,
      columns: data[0] ? Object.keys(data[0]) : []
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}