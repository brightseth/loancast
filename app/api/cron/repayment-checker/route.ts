import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Check for loan repayments and send reminders
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    // Find loans that need reminders
    const { data: loans, error } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('status', 'funded')
      .lte('due_ts', threeDaysFromNow.toISOString())
      .gte('due_ts', now.toISOString())
    
    if (error) {
      console.error('Error fetching loans:', error)
      return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
    }
    
    const reminders = []
    
    for (const loan of loans || []) {
      const dueDate = new Date(loan.due_ts)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      
      let reminderType = ''
      let message = ''
      
      if (daysUntilDue === 3) {
        reminderType = 'three_day_reminder'
        message = `Reminder: Your loan repayment of ${loan.repay_usdc} USDC is due in 3 days (${dueDate.toLocaleDateString()})`
      } else if (daysUntilDue === 1) {
        reminderType = 'one_day_reminder'
        message = `⚠️ Your loan repayment of ${loan.repay_usdc} USDC is due TOMORROW!`
      } else if (daysUntilDue === 0) {
        reminderType = 'due_today'
        message = `🚨 Your loan repayment of ${loan.repay_usdc} USDC is due TODAY!`
      }
      
      if (reminderType) {
        // Check if reminder already sent
        const { data: existing } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('loan_id', loan.id)
          .eq('type', reminderType)
          .single()
        
        if (!existing) {
          // Send reminder
          const notification = {
            user_fid: loan.borrower_fid,
            type: reminderType,
            title: 'Loan Payment Reminder',
            message,
            loan_id: loan.id,
            created_at: new Date().toISOString()
          }
          
          await supabaseAdmin
            .from('notifications')
            .insert(notification)
          
          reminders.push({
            loan_id: loan.id,
            borrower_fid: loan.borrower_fid,
            days_until_due: daysUntilDue,
            amount: loan.repay_usdc
          })
        }
      }
    }
    
    // Check for overdue loans
    const { data: overdueLoans } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('status', 'funded')
      .lt('due_ts', now.toISOString())
    
    for (const loan of overdueLoans || []) {
      const daysOverdue = Math.ceil((now.getTime() - new Date(loan.due_ts).getTime()) / (24 * 60 * 60 * 1000))
      
      // Update loan status if significantly overdue
      if (daysOverdue > 7) {
        await supabaseAdmin
          .from('loans')
          .update({ 
            status: 'default',
            updated_at: new Date().toISOString()
          })
          .eq('id', loan.id)
        
        // Notify both parties
        await supabaseAdmin
          .from('notifications')
          .insert([
            {
              user_fid: loan.borrower_fid,
              type: 'loan_defaulted',
              title: 'Loan Defaulted',
              message: `Your loan of ${loan.repay_usdc} USDC is now in default (${daysOverdue} days overdue)`,
              loan_id: loan.id,
              created_at: new Date().toISOString()
            },
            {
              user_fid: loan.lender_fid,
              type: 'loan_defaulted',
              title: 'Loan Defaulted',
              message: `The loan you funded (${loan.repay_usdc} USDC) is now in default (${daysOverdue} days overdue)`,
              loan_id: loan.id,
              created_at: new Date().toISOString()
            }
          ])
      }
    }
    
    return NextResponse.json({
      success: true,
      reminders_sent: reminders.length,
      overdue_count: overdueLoans?.length || 0,
      details: reminders
    })
    
  } catch (error) {
    console.error('Repayment checker error:', error)
    return NextResponse.json(
      { error: 'Failed to check repayments' },
      { status: 500 }
    )
  }
}