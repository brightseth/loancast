import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { confirm } = await request.json()
    
    if (confirm !== 'DELETE_ALL_LOANS_CONFIRM') {
      return NextResponse.json(
        { error: 'Must provide confirmation' },
        { status: 400 }
      )
    }
    
    // Delete all loans
    const { error, count } = await supabaseAdmin
      .from('loans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete everything except a non-existent ID
    
    if (error) {
      console.error('Error deleting loans:', error)
      return NextResponse.json(
        { error: 'Failed to delete loans', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `All loans deleted successfully`,
      count: count || 0
    })
    
  } catch (error) {
    console.error('Delete all loans error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}