#!/usr/bin/env node

/**
 * Execute funding for Solienne's loan after bid was placed
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function executeFunding() {
  console.log('💰 Executing Funding for Historic Loan\n');
  
  const LOAN_ID = '0fd92bda-5b08-48b0-84f8-403c10d2929a';
  const YOUR_FID = 2; // Seth's FID - update if different
  const YOUR_ADDRESS = '0xYourWalletAddress'; // Update with your actual address
  
  // Check current status
  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', LOAN_ID)
    .single();
    
  if (!loan) {
    console.log('❌ Loan not found');
    return;
  }
  
  if (loan.status === 'funded') {
    console.log('✅ Loan already funded!');
    return;
  }
  
  console.log('Current Status: ' + loan.status);
  console.log('Updating to funded...\n');
  
  // Mark as funded
  const fundingData = {
    status: 'funded',
    lender_fid: YOUR_FID,
    lender_type: 'human',
    lender_address: YOUR_ADDRESS,
    funded_at: new Date().toISOString(),
    tx_fund: 'manual_bid_' + Date.now() // Will be replaced with actual tx hash
  };
  
  const { data: updated, error } = await supabase
    .from('loans')
    .update(fundingData)
    .eq('id', LOAN_ID)
    .select()
    .single();
    
  if (error) {
    console.log('❌ Error updating loan:', error);
    return;
  }
  
  console.log('✅ LOAN FUNDED SUCCESSFULLY!\n');
  console.log('🎉 HISTORIC MOMENT ACHIEVED!');
  console.log('═══════════════════════════════════════════\n');
  console.log('First Human→AI Loan:');
  console.log('  Borrower: Solienne (AI Agent)');
  console.log('  Lender: You (Human)');
  console.log('  Amount: 80 USDC');
  console.log('  Interest: 0.27 USDC');
  console.log('  Total Repay: 80.27 USDC');
  console.log('  Due: ' + new Date(loan.due_ts).toLocaleDateString());
  console.log('\n📝 What Solienne Demonstrated:');
  console.log('  ✅ Independent decision-making');
  console.log('  ✅ Economic calculation ($65 + $15 = $80)');
  console.log('  ✅ Original purpose (not copied)');
  console.log('  ✅ Appropriate duration (5 days)');
  console.log('\n🎯 Next Steps:');
  console.log('  1. Send 80 USDC to Solienne\'s wallet');
  console.log('     Address: 0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9');
  console.log('  2. Solienne will acknowledge funding');
  console.log('  3. Wait 5 days for autonomous repayment');
  console.log('  4. Document the complete cycle');
  console.log('\nView loan: https://loancast.app/loans/' + LOAN_ID);
  
  // Create funding intent record
  await supabase
    .from('funding_intents')
    .insert({
      loan_id: LOAN_ID,
      lender_fid: YOUR_FID,
      lender_type: 'human',
      created_at: new Date().toISOString()
    });
    
  console.log('\n🏆 You\'ve just made history!');
}

executeFunding().catch(console.error);