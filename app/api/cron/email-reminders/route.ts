import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { emailService } from '@/lib/email'
import { getUserByFid } from '@/lib/neynar'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Starting email reminder cron job...')

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

    // Get loans that are due in 3 days, 1 day, or overdue
    const { data: loans, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('status', 'funded')
      .or(`due_ts.lte.${threeDaysFromNow.toISOString()},due_ts.lte.${now.toISOString()}`)

    if (error) {
      console.error('Error fetching loans:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    let remindersSent = 0
    const results = []

    for (const loan of loans || []) {
      try {
        const dueDate = new Date(loan.due_ts)
        const timeDiff = dueDate.getTime() - now.getTime()
        const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

        // Skip if not a reminder day (3 days, 1 day, or overdue)
        if (daysUntilDue !== 3 && daysUntilDue !== 1 && daysUntilDue > 0) {
          continue
        }

        // Check if we already sent a reminder for this time period
        const { data: existingReminder } = await supabaseAdmin
          .from('email_logs')
          .select('id')
          .eq('loan_id', loan.id)
          .eq('reminder_type', daysUntilDue <= 0 ? 'overdue' : `${daysUntilDue}day`)
          .single()

        if (existingReminder) {
          console.log(`Reminder already sent for loan ${loan.id} (${daysUntilDue}day)`)
          continue
        }

        // Get borrower info from Neynar
        const borrowerData = await getUserByFid(loan.borrower_fid)
        const borrowerName = (borrowerData as any)?.display_name || (borrowerData as any)?.username || `User ${loan.borrower_fid}`

        // Get lender info if available
        let lenderName = 'Anonymous'
        if (loan.lender_fid) {
          const lenderData = await getUserByFid(loan.lender_fid)
          lenderName = (lenderData as any)?.display_name || (lenderData as any)?.username || `User ${loan.lender_fid}`
        }

        const loanNumber = loan.loan_number 
          ? `LOANCAST-${loan.loan_number.toString().padStart(4, '0')}`
          : `#${loan.id.slice(0, 8).toUpperCase()}`

        const reminderData = {
          loanId: loan.id,
          loanNumber,
          borrowerName,
          lenderName,
          amount: loan.repay_usdc || 0,
          dueDate,
          daysUntilDue,
          repaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/loans/${loan.id}`
        }

        // Try to send email (will log preview if no email service configured)
        const borrowerEmail = (borrowerData as any)?.email // This would come from user profile if we stored emails
        const emailSent = await emailService.sendPaymentReminder(reminderData, borrowerEmail)

        // Log the reminder attempt
        await supabaseAdmin
          .from('email_logs')
          .insert({
            loan_id: loan.id,
            recipient_fid: loan.borrower_fid,
            email_type: 'payment_reminder',
            reminder_type: daysUntilDue <= 0 ? 'overdue' : `${daysUntilDue}day`,
            sent_successfully: emailSent,
            sent_at: now.toISOString()
          })

        results.push({
          loanId: loan.id,
          loanNumber,
          daysUntilDue,
          emailSent,
          borrowerName
        })

        if (emailSent) remindersSent++

      } catch (error) {
        console.error(`Error processing loan ${loan.id}:`, error)
        results.push({
          loanId: loan.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Email reminder job completed: ${remindersSent} reminders sent`)

    return NextResponse.json({
      success: true,
      processed: loans?.length || 0,
      remindersSent,
      results
    })

  } catch (error) {
    console.error('Email reminder cron job failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add POST method for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}