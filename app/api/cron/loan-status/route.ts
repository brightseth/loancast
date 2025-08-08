import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notificationService } from '@/lib/notifications'
import { updateReputationAfterEvent } from '@/lib/reputation'
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
      marked_due: 0,
      marked_overdue: 0,
      marked_defaulted: 0,
      errors: 0
    }
    
    // Get all funded loans
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
        const daysOverdue = Math.floor(-hoursUntilDue / 24)
        
        let newStatus = loan.status
        let statusChanged = false
        
        // Mark as due (within 24 hours of due date)
        if (hoursUntilDue <= 24 && hoursUntilDue > 0 && loan.status === 'funded') {
          newStatus = 'due'
          statusChanged = true
          results.marked_due++
          
          console.log(`Loan ${loan.loan_number} marked as DUE`)
        }
        
        // Mark as overdue (past due date but less than 7 days)
        else if (hoursUntilDue < 0 && daysOverdue < 7 && loan.status !== 'overdue' && loan.status !== 'defaulted') {
          newStatus = 'overdue'
          statusChanged = true
          results.marked_overdue++
          
          console.log(`Loan ${loan.loan_number} marked as OVERDUE (${daysOverdue} days)`)
          
          // Update borrower reputation for late payment
          await updateReputationAfterEvent(
            loan.borrower_fid.toString(),
            'repay_late',
            `Loan ${loan.loan_number} is ${daysOverdue} days overdue`
          )
        }
        
        // Mark as defaulted (7+ days overdue)
        else if (daysOverdue >= 7 && loan.status !== 'defaulted') {
          newStatus = 'defaulted'
          statusChanged = true
          results.marked_defaulted++
          
          console.log(`Loan ${loan.loan_number} marked as DEFAULTED (${daysOverdue} days overdue)`)
          
          // Update borrower reputation for default
          await updateReputationAfterEvent(
            loan.borrower_fid.toString(),
            'default',
            `Loan ${loan.loan_number} defaulted after ${daysOverdue} days`
          )
          
          // Get user names for notifications
          const { data: borrower } = await supabaseAdmin
            .from('users')
            .select('display_name')
            .eq('fid', loan.borrower_fid)
            .single()
          
          const { data: lender } = await supabaseAdmin
            .from('users')
            .select('display_name')
            .eq('fid', loan.lender_fid)
            .single()
          
          const borrowerName = borrower?.display_name || `User ${loan.borrower_fid}`
          const lenderName = lender?.display_name || `User ${loan.lender_fid}`
          const amount = loan.repay_usdc || loan.amount_usdc || 0
          
          // Send default notifications to both parties
          await notificationService.notifyLoanDefaulted(
            loan.lender_fid,
            loan.borrower_fid,
            loan.id,
            amount,
            borrowerName,
            lenderName
          )
        }
        
        // Update loan status if changed
        if (statusChanged) {
          const { error: updateError } = await supabaseAdmin
            .from('loans')
            .update({ 
              status: newStatus,
              updated_at: now.toISOString(),
              defaulted_at: newStatus === 'defaulted' ? now.toISOString() : null
            })
            .eq('id', loan.id)
          
          if (updateError) {
            console.error(`Error updating loan ${loan.id} status:`, updateError)
            results.errors++
          } else {
            // Create status change notification
            await supabaseAdmin
              .from('loan_status_history')
              .insert({
                loan_id: loan.id,
                old_status: loan.status,
                new_status: newStatus,
                changed_at: now.toISOString(),
                reason: newStatus === 'defaulted' 
                  ? `Defaulted after ${daysOverdue} days overdue`
                  : newStatus === 'overdue'
                  ? `Overdue by ${daysOverdue} days`
                  : 'Payment due within 24 hours'
              })
          }
        }
        
      } catch (loanError) {
        console.error(`Error processing loan ${loan.id}:`, loanError)
        results.errors++
      }
    }
    
    console.log('Loan status update cron job completed:', results)
    
    return NextResponse.json({
      success: true,
      message: 'Loan statuses updated',
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