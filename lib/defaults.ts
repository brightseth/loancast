import { supabaseAdmin } from './supabase'
import { createLoanCast } from './neynar'
import { addHours, isPast } from 'date-fns'

export interface DefaultProcess {
  gracePeriodHours: 48
  stages: Array<{
    hours: number
    action: string
    description: string
  }>
}

export const DEFAULT_PROCESS: DefaultProcess = {
  gracePeriodHours: 48,
  stages: [
    { hours: 0, action: 'send_reminder', description: 'Send reminder DM' },
    { hours: 24, action: 'post_warning', description: 'Post public warning' },
    { hours: 48, action: 'mark_default', description: 'Mark as defaulted' },
    { hours: 72, action: 'community_arbitration', description: 'Community review option' },
  ],
}

export async function processOverdueLoans() {
  try {
    // Find loans that are past due but not yet marked as default
    const { data: overdueLoans } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('status', 'open')
      .lt('due_ts', new Date().toISOString())

    if (!overdueLoans) return

    for (const loan of overdueLoans) {
      await processOverdueLoan(loan)
    }
  } catch (error) {
    console.error('Error processing overdue loans:', error)
  }
}

async function processOverdueLoan(loan: any) {
  const dueDate = new Date(loan.due_ts)
  const now = new Date()
  const hoursOverdue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60)

  // Check if we already have a default process started
  let { data: defaultProcess } = await supabaseAdmin
    .from('loan_defaults')
    .select('*')
    .eq('loan_id', loan.id)
    .single()

  // Start grace period if not already started
  if (!defaultProcess) {
    const gracePeriodEnd = addHours(dueDate, DEFAULT_PROCESS.gracePeriodHours)
    
    const { data: newDefault } = await supabaseAdmin
      .from('loan_defaults')
      .insert({
        loan_id: loan.id,
        grace_period_ends: gracePeriodEnd.toISOString(),
      })
      .select()
      .single()

    defaultProcess = newDefault
    
    // Send initial reminder
    await sendReminderDM(loan)
  }

  // Process stages based on hours overdue
  const currentStage = DEFAULT_PROCESS.stages.find(stage => 
    hoursOverdue >= stage.hours && 
    hoursOverdue < (DEFAULT_PROCESS.stages.find(s => s.hours > stage.hours)?.hours || Infinity)
  )

  if (!currentStage) return

  switch (currentStage.action) {
    case 'send_reminder':
      if (!defaultProcess.reminder_sent) {
        await sendReminderDM(loan)
        await supabaseAdmin
          .from('loan_defaults')
          .update({ reminder_sent: true })
          .eq('id', defaultProcess.id)
      }
      break

    case 'post_warning':
      if (!defaultProcess.warning_cast_hash) {
        const warningCast = await postWarningCast(loan)
        await supabaseAdmin
          .from('loan_defaults')
          .update({ warning_cast_hash: warningCast.hash })
          .eq('id', defaultProcess.id)
      }
      break

    case 'mark_default':
      if (isPast(new Date(defaultProcess.grace_period_ends))) {
        await markLoanAsDefault(loan, defaultProcess)
      }
      break
  }
}

async function sendReminderDM(loan: any) {
  // In a real implementation, this would send a Farcaster DM
  console.log(`Sending reminder DM for loan ${loan.id}`)
  
  // Could also post a subtle reminder cast
  const reminderText = `⏰ Friendly reminder: Your LoanCast repayment is due. 

Loan ID: ${loan.id.slice(0, 8)}...
Amount: $${loan.repay_usdc}

Maintain your reputation by repaying on time.`

  // Would use Neynar to send DM or create cast
}

async function postWarningCast(loan: any) {
  const warningText = `⚠️ LOAN STATUS UPDATE

Loan ${loan.id.slice(0, 8)}... is past due.
Grace period: 48 hours from due date.

Borrower: Please repay to maintain your reputation.
Community: This affects the borrower's credit score.`

  // Create warning cast as quote cast of original loan
  const cast = await createLoanCast(
    'system-signer', // Would need a system signer
    0, 0, new Date(), warningText
  )

  return cast
}

async function markLoanAsDefault(loan: any, defaultProcess: any) {
  // Update loan status
  await supabaseAdmin
    .from('loans')
    .update({ status: 'default' })
    .eq('id', loan.id)

  // Update default process
  await supabaseAdmin
    .from('loan_defaults')
    .update({ final_status: 'defaulted' })
    .eq('id', defaultProcess.id)

  // Update borrower reputation
  await updateBorrowerReputation(loan.borrower_fid, false)

  // Post final default notice
  const defaultText = `🚨 LOAN DEFAULTED

Loan ${loan.id.slice(0, 8)}... has been marked as defaulted.
Borrower reputation has been affected.

Amount: $${loan.repay_usdc}
Original due: ${new Date(loan.due_ts).toLocaleDateString()}

This impacts the borrower's ability to get future loans.`

  await createLoanCast(
    'system-signer',
    0, 0, new Date(), defaultText
  )
}

async function updateBorrowerReputation(borrowerFid: number, isRepaid: boolean) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('fid', borrowerFid)
    .single()

  if (!user) return

  let updates: any = {}

  if (isRepaid) {
    updates = {
      loans_repaid: user.loans_repaid + 1,
      repayment_streak: user.repayment_streak + 1,
      total_repaid: (user.total_repaid || 0) + user.total_borrowed,
    }
  } else {
    updates = {
      loans_defaulted: (user.loans_defaulted || 0) + 1,
      repayment_streak: 0,
    }
  }

  // Recalculate credit score
  const totalLoans = user.total_loans
  const repaidLoans = updates.loans_repaid || user.loans_repaid
  const defaultedLoans = updates.loans_defaulted || user.loans_defaulted

  const repaymentRate = totalLoans > 0 ? (repaidLoans / totalLoans) * 100 : 0
  const defaultPenalty = defaultedLoans * 15
  const streakBonus = Math.min((updates.repayment_streak || user.repayment_streak) * 2, 20)

  updates.credit_score = Math.max(
    Math.min(Math.round(repaymentRate * 0.8 + streakBonus - defaultPenalty), 100),
    0
  )

  await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('fid', borrowerFid)
}

// Function to be called by cron job
export async function runDefaultProcessor() {
  console.log('Running default processor...')
  await processOverdueLoans()
  console.log('Default processor completed')
}