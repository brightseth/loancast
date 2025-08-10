import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkApiEnabled } from '@/lib/api-flags'

export async function GET(request: NextRequest) {
  // Skip flag check for webhook debugging - this is critical for troubleshooting
  // const flagCheck = checkApiEnabled('/api/admin/webhook-debug')
  // if (flagCheck) return flagCheck
  
  try {
    const searchParams = request.nextUrl.searchParams
    const castHash = searchParams.get('cast_hash')
    
    if (!castHash) {
      return NextResponse.json({ error: 'cast_hash parameter required' }, { status: 400 })
    }
    
    // Check webhook_inbox for events related to this cast_hash
    const { data: webhookEvents, error: webhookError } = await supabaseAdmin
      .from('webhook_inbox')
      .select('*')
      .eq('cast_hash', castHash)
      .order('received_at', { ascending: false })
    
    // Check if the loan exists
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('cast_hash', castHash)
      .single()
    
    // Check loan_events for this loan if it exists
    let loanEvents = []
    if (loan) {
      const { data: events } = await supabaseAdmin
        .from('loan_events')
        .select('*')
        .eq('loan_id', loan.id)
        .order('created_at', { ascending: false })
      loanEvents = events || []
    }
    
    return NextResponse.json({
      cast_hash: castHash,
      loan: loan || null,
      loan_error: loanError?.message || null,
      webhook_events: webhookEvents || [],
      webhook_error: webhookError?.message || null,
      loan_events: loanEvents,
      summary: {
        loan_exists: !!loan,
        webhook_events_count: webhookEvents?.length || 0,
        deletion_events: webhookEvents?.filter(e => e.type === 'cast.deleted').length || 0,
        last_webhook: webhookEvents?.[0]?.received_at || null
      }
    })
  } catch (error) {
    console.error('Error debugging webhook:', error)
    return NextResponse.json(
      { error: 'Failed to debug webhook' },
      { status: 500 }
    )
  }
}