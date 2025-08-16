#!/usr/bin/env node

/**
 * Monitor Solienne's loan auction status
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LOAN_ID = '0fd92bda-5b08-48b0-84f8-403c10d2929a';

async function monitorAuction() {
  console.clear();
  console.log('🎨 MONITORING SOLIENNE\'S LOAN AUCTION');
  console.log('═══════════════════════════════════════════\n');
  
  // Check loan status
  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', LOAN_ID)
    .single();
    
  if (loan) {
    console.log('📋 Loan Details:');
    console.log(`   Amount: ${loan.gross_usdc} USDC`);
    console.log(`   Purpose: "${loan.description}"`);
    console.log(`   Status: ${loan.status.toUpperCase()}`);
    console.log(`   Repayment: ${loan.repay_usdc} USDC`);
    console.log(`   Due: ${new Date(loan.due_ts).toLocaleDateString()}\n`);
    
    if (loan.status === 'funded') {
      console.log('✅ LOAN FUNDED!');
      console.log(`   Lender FID: ${loan.lender_fid}`);
      console.log(`   Funded At: ${new Date(loan.funded_at).toLocaleString()}`);
      console.log('\n🎉 HISTORIC FIRST HUMAN→AI LOAN IS ACTIVE!');
      console.log('\nNext: Solienne will acknowledge funding');
      console.log('Then: Autonomous repayment in 5 days');
      return true; // Stop monitoring
    }
  }
  
  // Check bids on this loan
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('loan_id', LOAN_ID)
    .order('bid_usdc', { ascending: false });
    
  if (bids && bids.length > 0) {
    console.log('🏷️ Current Bids:');
    bids.forEach((bid, index) => {
      const status = index === 0 ? '👑 WINNING' : '   ';
      console.log(`   ${status} FID ${bid.bidder_fid}: $${bid.bid_usdc || '?'} (${bid.status})`);
    });
    console.log('\n⏳ Waiting for auction to settle...');
    console.log('   The winning bid will fund the loan');
  } else {
    console.log('⏳ No bids yet on this loan');
    console.log('   Your $80 bid may still be processing');
  }
  
  console.log('\n📍 Loan URL: https://loancast.app/loans/' + LOAN_ID);
  console.log('\nRefreshing every 10 seconds...');
  console.log('Press Ctrl+C to stop monitoring');
  
  return false; // Continue monitoring
}

// Run initial check
monitorAuction().then(funded => {
  if (!funded) {
    // Set up monitoring loop
    const interval = setInterval(async () => {
      const funded = await monitorAuction();
      if (funded) {
        clearInterval(interval);
        console.log('\n🏁 Monitoring complete!');
      }
    }, 10000); // Check every 10 seconds
  }
});

console.log('Starting auction monitor...');