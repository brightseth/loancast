import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin FID - change this to your actual FID
const ADMIN_FID = 5046 // seth's FID

const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/\s+/g, '')

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get loan with bids
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (loanError || !loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Get bids for this loan
    const { data: bids, error: bidsError } = await supabaseAdmin
      .from('bids')
      .select('*')
      .eq('loan_id', id)
      .order('amount', { ascending: false })

    if (bidsError) {
      console.error('Error fetching bids:', bidsError)
    }

    return NextResponse.json({
      ...loan,
      bids: bids || []
    })
  } catch (error) {
    console.error('Get loan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete loan
    const { error } = await supabaseAdmin
      .from('loans')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting loan:', error)
      return NextResponse.json(
        { error: 'Failed to delete loan' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete loan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}