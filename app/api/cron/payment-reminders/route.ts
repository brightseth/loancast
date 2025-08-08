import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notificationService } from '@/lib/notifications'
import { headers } from 'next/headers'

// Protect cron endpoint
function verifyCronSecret(request: NextRequest): boolean {
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  return token === process.env.CRON_SECRET
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const now = new Date()
    const results = {
      processed: 0,
      reminders_24h: 0,
      reminders_2h: 0,
      overdue: 0,
      errors: 0
    }
    
    // Get all funded loans with repayment dates
    const { data: loans, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('status', 'funded')
      .not('repay_by', 'is', null)
    
    if (error) {
      console.error('Error fetching loans:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch loans',
        details: error.message 
      }, { status: 500 })
    }
    
    if (!loans || loans.length === 0) {
      return NextResponse.json({ 
        message: 'No loans to process',
        results 
      })
    }
    
    for (const loan of loans) {
      results.processed++
      
      try {
        const dueDate = new Date(loan.repay_by)
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        
        // Check if we need to send a reminder
        let shouldSendReminder = false
        let reminderType = ''
        
        // 24-hour reminder window (between 23-25 hours)
        if (hoursUntilDue >= 23 && hoursUntilDue <= 25) {
          // Check if we already sent 24h reminder
          const { data: existing24h } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('loan_id', loan.id)
            .eq('type', 'payment_reminder')
            .eq('metadata->hours_until_due', 24)
            .single()
          
          if (!existing24h) {
            shouldSendReminder = true
            reminderType = '24h'
            results.reminders_24h++
          }
        }
        
        // 2-hour reminder window (between 1.5-2.5 hours)
        else if (hoursUntilDue >= 1.5 && hoursUntilDue <= 2.5) {
          // Check if we already sent 2h reminder
          const { data: existing2h } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('loan_id', loan.id)
            .eq('type', 'payment_reminder')
            .eq('metadata->hours_until_due', 2)
            .single()
          
          if (!existing2h) {
            shouldSendReminder = true
            reminderType = '2h'
            results.reminders_2h++
          }
        }
        
        // Overdue reminder (once per day after due date)
        else if (hoursUntilDue < 0) {
          // Check if we sent an overdue reminder in the last 24 hours
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          
          const { data: recentOverdue } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('loan_id', loan.id)
            .eq('type', 'payment_reminder')
            .lt('metadata->hours_until_due', 0)
            .gte('created_at', yesterday.toISOString())
            .single()
          
          if (!recentOverdue) {
            shouldSendReminder = true
            reminderType = 'overdue'
            results.overdue++
          }
        }
        
        // Send reminder if needed
        if (shouldSendReminder) {
          const amount = loan.repay_usdc || loan.amount_usdc || 0
          const loanNumber = loan.loan_number || `LOAN-${loan.id.slice(0, 8)}`
          
          // Determine hours for notification (24, 2, or negative for overdue)
          let notificationHours = 0
          if (reminderType === '24h') notificationHours = 24
          else if (reminderType === '2h') notificationHours = 2
          else if (reminderType === 'overdue') notificationHours = Math.floor(hoursUntilDue)
          
          await notificationService.notifyPaymentReminder(
            loan.borrower_fid,
            loan.id,
            loanNumber,
            amount,
            dueDate,
            notificationHours
          )
          
          console.log(`Sent ${reminderType} reminder for loan ${loanNumber}`)
        }
        
      } catch (loanError) {
        console.error(`Error processing loan ${loan.id}:`, loanError)
        results.errors++
      }
    }
    
    console.log('Payment reminder cron job completed:', results)
    
    return NextResponse.json({
      success: true,
      message: 'Payment reminders processed',
      results,
      timestamp: now.toISOString()
    })
    
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint for manual trigger (admin only)
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const headersList = headers()
  const adminKey = headersList.get('x-admin-key')
  
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Call GET handler
  return GET(request)
}