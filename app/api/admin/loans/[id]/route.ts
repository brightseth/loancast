import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Simple admin check - in production, validate JWT or API key
    // For now, just delete the loan
    const { error } = await supabaseAdmin
      .from('loans')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting loan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}