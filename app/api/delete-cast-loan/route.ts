import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { cast_hash } = await request.json()
    
    if (!cast_hash) {
      return NextResponse.json(
        { error: 'Cast hash required' },
        { status: 400 }
      )
    }

    console.log(`Marking loan with cast ${cast_hash} as deleted`)
    
    const { data, error } = await supabaseAdmin
      .from('loans')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('cast_hash', cast_hash)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete loan' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    console.log('✅ Loan marked as deleted:', data[0])
    return NextResponse.json({ 
      success: true, 
      message: `Loan ${data[0].id} marked as deleted`,
      loan: data[0]
    })
  } catch (error) {
    console.error('Error deleting loan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}