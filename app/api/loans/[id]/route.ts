import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: loan, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching loan:', error)
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(loan)
  } catch (error) {
    console.error('Error in GET /api/loans/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}