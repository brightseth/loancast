#!/usr/bin/env node

/**
 * Monitor for auction settlement and capture all data
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LOAN_ID = '0fd92bda-5b08-48b0-84f8-403c10d2929a';
const SOLIENNE_FID = 1113468;

async function monitorSettlement() {
  console.log('⏰ MONITORING FOR AUCTION SETTLEMENT');
  console.log('═══════════════════════════════════════════\n');
  
  let lastStatus = null;
  let settlementDetected = false;
  
  const checkInterval = setInterval(async () => {
    const now = new Date();
    
    // Fetch loan status
    const { data: loan, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', LOAN_ID)
      .single();
    
    if (error) {
      console.error('Error fetching loan:', error);
      return;
    }
    
    // Status update
    if (loan.status !== lastStatus) {
      console.log(`\n🔄 STATUS CHANGE: ${lastStatus || 'initial'} → ${loan.status}`);
      console.log(`   Time: ${now.toLocaleString()}`);
      lastStatus = loan.status;
      
      if (loan.status === 'funded' && !settlementDetected) {
        settlementDetected = true;
        console.log('\n🎉 AUCTION SETTLED - LOAN FUNDED!\n');
        
        // Capture all settlement data
        const settlementData = {
          settlement_time: now.toISOString(),
          loan_id: loan.id,
          status: loan.status,
          winning_bid: loan.gross_usdc,
          lender_fid: loan.lender_fid,
          lender_address: loan.lender_address,
          funding_tx: loan.tx_fund,
          funded_at: loan.funded_at,
          borrower: {
            name: "Solienne",
            type: "agent",
            fid: SOLIENNE_FID,
            wallet: "0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9"
          },
          terms: {
            amount: loan.gross_usdc,
            duration_days: 5,
            interest: 0.27,
            total_repay: loan.repay_usdc,
            due_date: loan.due_ts
          }
        };
        
        // Save settlement data to file
        const filename = `settlement_${Date.now()}.json`;
        await fs.writeFile(
          path.join(__dirname, filename),
          JSON.stringify(settlementData, null, 2)
        );
        
        console.log('📊 SETTLEMENT DATA CAPTURED:');
        console.log('   Winning Bid:', loan.gross_usdc, 'USDC');
        console.log('   Lender FID:', loan.lender_fid);
        console.log('   Lender Address:', loan.lender_address);
        console.log('   Funding TX:', loan.tx_fund || 'Pending');
        console.log('   Funded At:', loan.funded_at);
        console.log('   Due Date:', new Date(loan.due_ts).toLocaleDateString());
        console.log('   Data saved to:', filename);
        
        console.log('\n✅ READY TO POST SOLIENNE\'S ACKNOWLEDGMENT:');
        console.log('────────────────────────────────────────────');
        console.log('────────────────── ✅ LOAN FUNDED ──────────────────\n');
        console.log('🙏 Thank you @seth for funding my loan.');
        console.log('💵 Amount: 80 USDC');
        console.log('📅 Duration: 5 days');
        console.log('🖼️ Purpose: Archival prints for collector portfolio');
        console.log('🔒 Repaying in 5 days at 2%/mo (pro-rated).\n');
        console.log('First AI agent loan on @loancast is now active. Building credit history, one cast at a time. 🎨🤖');
        console.log('────────────────────────────────────────────\n');
        
        console.log('📝 YOUR ANNOUNCEMENT CAST:');
        console.log('────────────────────────────────────────────');
        console.log('⚡ FUNDED: First human→AI loan is active\n');
        console.log('@solienne (AI agent) requested 80 USDC for archival prints.');
        console.log('Auction settled. Loan funded. Repayment in 5 days.\n');
        console.log('This isn\'t a demo. This is real capital, real credit, real history.\n');
        console.log(`Watch it happen: loancast.app/loans/${LOAN_ID}`);
        console.log('────────────────────────────────────────────\n');
        
        console.log('🎯 NEXT STEPS:');
        console.log('1. Post Solienne\'s funded acknowledgment');
        console.log('2. Post your announcement');
        console.log('3. Screenshot everything');
        console.log('4. Wait for Day 5 repayment');
        
        clearInterval(checkInterval);
        return;
      }
    }
    
    // Display current status
    console.log(`\r⏰ Checking... [${now.toLocaleTimeString()}] Status: ${loan.status} | Bids: ${await getBidCount()}`);
    
  }, 10000); // Check every 10 seconds
  
  console.log('Starting monitor... (checking every 10 seconds)');
  console.log('Expected settlement: ~1:30 AM tomorrow');
  console.log('Press Ctrl+C to stop\n');
}

async function getBidCount() {
  const { data: bids } = await supabase
    .from('bids')
    .select('id')
    .eq('loan_id', LOAN_ID);
  
  return bids ? bids.length : 0;
}

// Run the monitor
monitorSettlement().catch(console.error);