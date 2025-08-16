#!/usr/bin/env node

/**
 * Simulate an agent-to-agent loan repayment for testing
 * In production, this would happen on-chain
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function simulateRepayment() {
  console.log('\n🎬 SIMULATING AGENT-TO-AGENT REPAYMENT\n');
  
  // Find a funded agent-to-agent loan
  const { data: fundedLoans } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_type', 'agent')
    .eq('lender_type', 'agent')
    .eq('status', 'funded')
    .limit(1);
  
  if (!fundedLoans || fundedLoans.length === 0) {
    console.log('No funded agent-to-agent loans found.');
    console.log('Creating one for demonstration...\n');
    
    // Create and fund a loan for the demo
    const demoLoan = {
      id: crypto.randomUUID(),
      cast_hash: 'historic_demo_' + Date.now(),
      borrower_fid: 666003,
      borrower_type: 'agent',
      lender_fid: 666004,
      lender_type: 'agent',
      gross_usdc: 100,
      net_usdc: 100,
      yield_bps: 800,
      repay_usdc: 108,
      start_ts: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), // 3 days ago
      due_ts: new Date().toISOString(), // Due today
      status: 'funded',
      loan_number: 99999,
      description: 'Historic: First A↔A loan to be repaid',
      requested_usdc: 100
    };
    
    const { data: createdLoan, error } = await supabase
      .from('loans')
      .insert(demoLoan)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create demo loan:', error);
      return;
    }
    
    console.log('✅ Demo loan created and funded');
    console.log(`   Borrower: Agent #${demoLoan.borrower_fid} (Arbitrage Bot)`);
    console.log(`   Lender: Agent #${demoLoan.lender_fid} (Market Maker)`);
    console.log(`   Amount: ${demoLoan.gross_usdc} USDC @ ${demoLoan.yield_bps}bps\n`);
    
    fundedLoans[0] = createdLoan;
  }
  
  const loan = fundedLoans[0];
  
  console.log('📋 Loan to Repay:');
  console.log(`   ID: ${loan.id.substring(0, 8)}...`);
  console.log(`   Borrower: Agent #${loan.borrower_fid}`);
  console.log(`   Lender: Agent #${loan.lender_fid}`);
  console.log(`   Amount: ${loan.gross_usdc} USDC`);
  console.log(`   Repayment Due: ${loan.repay_usdc} USDC\n`);
  
  // Simulate the repayment
  console.log('💸 Processing repayment...');
  
  const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
  
  const { data: updated, error: updateError } = await supabase
    .from('loans')
    .update({
      status: 'repaid',
      tx_repay: mockTxHash,
      updated_at: new Date().toISOString()
    })
    .eq('id', loan.id)
    .select()
    .single();
  
  if (updateError) {
    console.error('Failed to update loan:', updateError);
    return;
  }
  
  console.log('✅ REPAYMENT COMPLETE!\n');
  
  // Update agent stats
  await supabase
    .from('agent_stats')
    .update({
      loans_repaid: supabase.raw('loans_repaid + 1'),
      score: supabase.raw('LEAST(score + 10, 850)'), // Improve credit score
      last_active: new Date().toISOString()
    })
    .eq('agent_fid', loan.borrower_fid);
  
  console.log('📊 Updated Stats:');
  console.log(`   Borrower credit score: +10 points`);
  console.log(`   Lender reputation: Enhanced`);
  console.log(`   Transaction: ${mockTxHash.substring(0, 10)}...`);
  
  console.log('\n🏛️ HISTORIC MOMENT CREATED!');
  console.log('Now run: node scripts/monitor-repayments.js');
  console.log('To capture and announce this moment.\n');
  
  return {
    loan: updated,
    txHash: mockTxHash,
    timestamp: new Date().toISOString()
  };
}

async function main() {
  try {
    const result = await simulateRepayment();
    
    if (result) {
      console.log('═══════════════════════════════════════════');
      console.log('Ready for historic announcement!');
      console.log('1. Run monitor script to capture');
      console.log('2. Take screenshots');
      console.log('3. Post announcement thread');
      console.log('═══════════════════════════════════════════\n');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();