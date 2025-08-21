#!/usr/bin/env node

/**
 * Monitor Solienne's loan repayment - due August 21st, 2025
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SOLIENNE_LOAN_ID = '0fd92bda-5b08-48b0-84f8-403c10d2929a';
const SOLIENNE_FID = 1113468;

async function monitorRepayment() {
  console.log('🤖 SOLIENNE REPAYMENT MONITOR');
  console.log('════════════════════════════════════════\n');

  try {
    // Get loan details
    const { data: loan, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', SOLIENNE_LOAN_ID)
      .single();

    if (error) {
      console.error('❌ Error fetching loan:', error);
      return;
    }

    if (!loan) {
      console.error('❌ Loan not found');
      return;
    }

    const now = new Date();
    const dueDate = new Date(loan.due_ts);
    const timeUntilDue = dueDate - now;
    const daysUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24));

    console.log('📊 LOAN STATUS:');
    console.log(`   ID: ${loan.id}`);
    console.log(`   Borrower: Solienne (${SOLIENNE_FID})`);
    console.log(`   Lender: Seth (${loan.lender_fid})`);
    console.log(`   Amount: ${loan.gross_usdc} USDC`);
    console.log(`   Repay amount: ${loan.repay_usdc} USDC`);
    console.log(`   Status: ${loan.status}`);
    console.log(`   Due: ${dueDate.toLocaleString()}`);
    console.log(`   Days until due: ${daysUntilDue}`);

    if (loan.status === 'repaid') {
      console.log('\n✅ LOAN ALREADY REPAID');
      console.log('Historic first AI agent loan completed successfully!');
      return;
    }

    if (daysUntilDue <= 0) {
      console.log('\n⚠️  LOAN OVERDUE');
      console.log('Checking for repayment transactions...');
      await checkForRepaymentTransaction(loan);
    } else if (daysUntilDue <= 1) {
      console.log('\n⏰ LOAN DUE SOON');
      console.log('Monitoring for repayment activity...');
      await checkForRepaymentTransaction(loan);
    } else {
      console.log('\n✅ LOAN ON TRACK');
      console.log(`Repayment due in ${daysUntilDue} days`);
    }

    // Check Solienne's wallet balance
    await checkSolienneWallet();

    // Show next steps
    console.log('\n🔔 NOTIFICATIONS:');
    if (daysUntilDue > 1) {
      console.log('- Set reminder for 24 hours before due date');
      console.log('- Monitor for early repayment');
    } else if (daysUntilDue === 1) {
      console.log('- Alert: Repayment due tomorrow');
      console.log('- Check agent wallet balance');
    } else {
      console.log('- URGENT: Check for repayment transaction');
      console.log('- Consider automated repayment trigger');
    }

  } catch (error) {
    console.error('❌ Monitoring error:', error);
  }
}

async function checkForRepaymentTransaction(loan) {
  console.log('\n🔍 Checking for repayment transaction...');
  
  // In a real implementation, this would check:
  // 1. Base network for USDC transfers to Seth's wallet
  // 2. Amount matching loan.repay_usdc
  // 3. Transaction timestamp after loan funding
  
  console.log('📝 Manual verification needed:');
  console.log(`   Expected amount: ${loan.repay_usdc} USDC`);
  console.log(`   To address: Seth's wallet`);
  console.log(`   From address: Solienne's wallet`);
  console.log('   Check Base network transactions');
}

async function checkSolienneWallet() {
  console.log('\n💰 SOLIENNE WALLET STATUS:');
  
  // In production, would check actual wallet balance
  console.log('   Address: Solienne\'s connected wallet');
  console.log('   Balance: Check USDC on Base network');
  console.log('   Status: Monitoring for sufficient funds');
}

async function triggerRepaymentReminder() {
  console.log('\n📬 REPAYMENT REMINDER');
  console.log('════════════════════════════════════════');
  
  const reminderMessage = `
🤖 Repayment Reminder for Solienne

Your loan is due tomorrow (August 21st):
• Amount to repay: 80.27 USDC
• To: Seth (lender)
• On: Base network

This is a historic moment - the first AI agent loan repayment!
Your credit score will increase upon successful repayment. 📈

Automated repayment system should handle this automatically.
  `.trim();

  console.log(reminderMessage);
  
  // In production, would:
  // - Post cast reminder
  // - Send notification to Eden system
  // - Trigger automated repayment if configured
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args[0] === 'reminder') {
  triggerRepaymentReminder();
} else {
  monitorRepayment();
}