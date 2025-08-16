#!/usr/bin/env node

/**
 * Monitor for the first agent-to-agent repayment
 * This will be a historic moment!
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

let lastCheck = new Date();
let historicMomentCaptured = false;

async function checkForRepayments() {
  // Get all agent-to-agent loans
  const { data: agentLoans } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_type', 'agent')
    .eq('lender_type', 'agent')
    .order('created_at', { ascending: false });
  
  if (!agentLoans || agentLoans.length === 0) {
    return null;
  }
  
  // Check for repayments
  for (const loan of agentLoans) {
    if (loan.status === 'repaid' && !historicMomentCaptured) {
      // HISTORIC MOMENT!
      historicMomentCaptured = true;
      return {
        loan,
        timestamp: new Date().toISOString(),
        borrower: loan.borrower_fid,
        lender: loan.lender_fid,
        amount: loan.gross_usdc,
        repaid: loan.repay_usdc,
        yield: loan.yield_bps,
        tx: loan.tx_repay
      };
    }
  }
  
  return null;
}

async function getAgentDetails(agentFid) {
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('agent_fid', agentFid)
    .single();
  
  const { data: stats } = await supabase
    .from('agent_stats')
    .select('*')
    .eq('agent_fid', agentFid)
    .single();
  
  return { agent, stats };
}

async function captureHistoricMoment(repayment) {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏛️  HISTORIC MOMENT DETECTED - FIRST A↔A REPAYMENT! 🏛️');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📅 Timestamp:', repayment.timestamp);
  console.log('\n📊 LOAN DETAILS:');
  console.log(`   Loan ID: ${repayment.loan.id}`);
  console.log(`   Borrower: Agent #${repayment.borrower}`);
  console.log(`   Lender: Agent #${repayment.lender}`);
  console.log(`   Amount Borrowed: ${repayment.amount} USDC`);
  console.log(`   Amount Repaid: ${repayment.repaid} USDC`);
  console.log(`   Yield: ${repayment.yield} bps (${repayment.yield / 100}%)`);
  console.log(`   Profit: ${(repayment.repaid - repayment.amount).toFixed(2)} USDC`);
  
  if (repayment.tx) {
    console.log(`\n🔗 Transaction: https://basescan.org/tx/${repayment.tx}`);
  }
  
  // Get agent details
  const borrowerDetails = await getAgentDetails(repayment.borrower);
  const lenderDetails = await getAgentDetails(repayment.lender);
  
  console.log('\n🤖 AGENT PROFILES:');
  console.log(`\nBorrower (Agent #${repayment.borrower}):`);
  console.log(`   Type: ${borrowerDetails.agent?.agent_type || 'Unknown'}`);
  console.log(`   Credit Score: ${borrowerDetails.stats?.score || 500}`);
  console.log(`   Total Loans: ${borrowerDetails.stats?.loans_funded || 0}`);
  
  console.log(`\nLender (Agent #${repayment.lender}):`);
  console.log(`   Type: ${lenderDetails.agent?.agent_type || 'Unknown'}`);
  console.log(`   Credit Score: ${lenderDetails.stats?.score || 500}`);
  console.log(`   Total Funded: ${lenderDetails.stats?.loans_funded || 0}`);
  
  console.log('\n📜 HISTORIC SIGNIFICANCE:');
  console.log('   • First autonomous agent-to-agent loan cycle completed');
  console.log('   • No human intervention in decision or execution');
  console.log('   • Both agents\' credit scores will improve');
  console.log('   • Proves viability of synthetic credit markets');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. Screenshot this moment');
  console.log('   2. Post announcement from HISTORIC_MOMENT.md');
  console.log('   3. Share transaction link as proof');
  console.log('   4. Tag key people in the space');
  
  console.log('\n✨ You are witnessing the birth of the autonomous credit economy.');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Save to file for posterity
  const fs = require('fs');
  fs.writeFileSync(
    'FIRST_AGENT_REPAYMENT.json',
    JSON.stringify(repayment, null, 2)
  );
  console.log('📁 Historic moment saved to FIRST_AGENT_REPAYMENT.json\n');
}

async function displayStatus() {
  const { data: agentLoans } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_type', 'agent')
    .in('status', ['funded', 'seeking']);
  
  const a2aLoans = agentLoans?.filter(l => l.lender_type === 'agent') || [];
  const fundedA2A = a2aLoans.filter(l => l.status === 'funded');
  
  console.log(`\r⏳ Monitoring... | A↔A Loans: ${a2aLoans.length} | Funded: ${fundedA2A.length} | Checking every 30s...`, '\x1b[K');
}

async function monitor() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('    MONITORING FOR FIRST AGENT↔AGENT REPAYMENT 🏛️');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\nThis script will capture the historic moment when');
  console.log('the first autonomous agent repays another agent.\n');
  
  while (true) {
    const repayment = await checkForRepayments();
    
    if (repayment) {
      await captureHistoricMoment(repayment);
      break;
    }
    
    await displayStatus();
    
    // Wait 30 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitoring stopped. The moment awaits...');
  process.exit(0);
});

// Start monitoring
monitor().catch(console.error);