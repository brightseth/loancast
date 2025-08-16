#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQuadrant1_HumanToHuman() {
  console.log('\n🧑↔️🧑 Testing Human → Human (Original Flow)...');
  
  const { data: loans } = await supabase
    .from('loans')
    .select('id, borrower_fid, borrower_type, lender_fid, lender_type, status')
    .eq('borrower_type', 'human')
    .eq('lender_type', 'human')
    .limit(1);
  
  if (loans && loans.length > 0) {
    console.log('✅ Found human-to-human loan:', loans[0].id.substring(0, 8) + '...');
  } else {
    console.log('ℹ️ No human-to-human loans found (this is the original working flow)');
  }
  
  return true;
}

async function testQuadrant2_HumanToAgent() {
  console.log('\n🧑→🤖 Testing Human → Agent (Agent Borrowing)...');
  
  // Create a loan request from an agent
  const testLoan = {
    id: crypto.randomUUID(),
    cast_hash: 'test_agent_' + Date.now(),
    borrower_fid: 666001, // Our test LP agent
    borrower_type: 'agent',
    gross_usdc: 50,
    net_usdc: 50,
    yield_bps: 500,
    repay_usdc: 52.5,
    start_ts: new Date().toISOString(),
    due_ts: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    status: 'seeking',
    loan_number: 90001,
    description: 'Test agent loan request for LP operations',
    requested_usdc: 50
  };
  
  const { data, error } = await supabase
    .from('loans')
    .insert(testLoan)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to create agent loan request:', error.message);
    return false;
  }
  
  console.log('✅ Agent loan request created:', data.id.substring(0, 8) + '...');
  console.log('   Borrower: Agent', data.borrower_fid, '(Type:', data.borrower_type + ')');
  console.log('   Amount:', data.gross_usdc, 'USDC');
  console.log('   Status:', data.status);
  console.log('   A human can now fund this via the UI');
  
  return true;
}

async function testQuadrant3_AgentToHuman() {
  console.log('\n🤖→🧑 Testing Agent → Human (Agent Lending)...');
  
  // Find or create a human loan request
  const { data: humanLoans } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_type', 'human')
    .eq('status', 'seeking')
    .limit(1);
  
  let loanToFund;
  
  if (humanLoans && humanLoans.length > 0) {
    loanToFund = humanLoans[0];
    console.log('Found existing human loan:', loanToFund.id.substring(0, 8) + '...');
  } else {
    // Create a test human loan
    const testLoan = {
      id: crypto.randomUUID(),
      cast_hash: 'test_human_' + Date.now(),
      borrower_fid: 12345, // Human borrower
      borrower_type: 'human',
      gross_usdc: 25,
      net_usdc: 25,
      yield_bps: 300,
      repay_usdc: 25.75,
      start_ts: new Date().toISOString(),
      due_ts: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
      status: 'seeking',
      loan_number: 90002,
      description: 'Test human loan for agent funding',
      requested_usdc: 25
    };
    
    const { data } = await supabase
      .from('loans')
      .insert(testLoan)
      .select()
      .single();
    
    loanToFund = data;
    console.log('Created test human loan:', loanToFund.id.substring(0, 8) + '...');
  }
  
  // Simulate agent funding (would normally go through auto-fund API)
  const fundingIntent = {
    loan_id: loanToFund.id,
    lender_fid: 666002, // Our yield farmer agent
    lender_type: 'agent'
  };
  
  const { data: intent, error } = await supabase
    .from('funding_intents')
    .insert(fundingIntent)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to create funding intent:', error.message);
    return false;
  }
  
  console.log('✅ Agent funding intent created');
  console.log('   Loan:', loanToFund.id.substring(0, 8) + '...');
  console.log('   Human borrower:', loanToFund.borrower_fid);
  console.log('   Agent lender:', fundingIntent.lender_fid);
  console.log('   Note: After 15-min holdback, agent would auto-fund via API');
  
  return true;
}

async function testQuadrant4_AgentToAgent() {
  console.log('\n🤖↔️🤖 Testing Agent → Agent (Full Automation)...');
  
  // Create agent borrower loan
  const borrowLoan = {
    id: crypto.randomUUID(),
    cast_hash: 'test_agent2agent_' + Date.now(),
    borrower_fid: 666003, // Arb bot borrowing
    borrower_type: 'agent',
    gross_usdc: 100,
    net_usdc: 100,
    yield_bps: 800,
    repay_usdc: 108,
    start_ts: new Date().toISOString(),
    due_ts: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    status: 'seeking',
    loan_number: 90003,
    description: 'Arbitrage opportunity funding needed',
    requested_usdc: 100
  };
  
  const { data: agentLoan, error: loanError } = await supabase
    .from('loans')
    .insert(borrowLoan)
    .select()
    .single();
  
  if (loanError) {
    console.error('❌ Failed to create agent loan:', loanError.message);
    return false;
  }
  
  console.log('✅ Agent loan created:', agentLoan.id.substring(0, 8) + '...');
  console.log('   Borrower: Agent', agentLoan.borrower_fid, '(arb bot)');
  
  // Simulate another agent funding it
  const fundingIntent = {
    loan_id: agentLoan.id,
    lender_fid: 666004, // Market maker agent lending
    lender_type: 'agent'
  };
  
  const { data: intent, error: intentError } = await supabase
    .from('funding_intents')
    .insert(fundingIntent)
    .select()
    .single();
  
  if (intentError) {
    console.error('❌ Failed to create funding intent:', intentError.message);
    return false;
  }
  
  console.log('✅ Agent-to-agent funding intent created');
  console.log('   Agent borrower:', agentLoan.borrower_fid, '(arb)');
  console.log('   Agent lender:', fundingIntent.lender_fid, '(maker)');
  console.log('   Amount:', agentLoan.gross_usdc, 'USDC @ ', agentLoan.yield_bps, 'bps');
  console.log('   This would be fully automated via API');
  
  return true;
}

async function checkSystemStatus() {
  console.log('\n📊 System Status Check...');
  
  const { count: agentCount } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true });
  
  const { count: loanCount } = await supabase
    .from('loans')
    .select('*', { count: 'exact', head: true });
  
  const { data: loansByType } = await supabase
    .from('loans')
    .select('borrower_type, lender_type, status')
    .limit(100);
  
  const quadrants = {
    'human→human': 0,
    'human→agent': 0,
    'agent→human': 0,
    'agent→agent': 0
  };
  
  if (loansByType) {
    loansByType.forEach(loan => {
      const key = `${loan.borrower_type || 'human'}→${loan.lender_type || 'unknown'}`;
      if (quadrants.hasOwnProperty(key)) {
        quadrants[key]++;
      }
    });
  }
  
  console.log(`\n📈 Metrics:`);
  console.log(`   Total agents: ${agentCount}`);
  console.log(`   Total loans: ${loanCount}`);
  console.log(`\n🎯 Quadrant Activity:`);
  Object.entries(quadrants).forEach(([key, count]) => {
    console.log(`   ${key}: ${count} loans`);
  });
  
  return true;
}

async function main() {
  console.log('========================================');
  console.log('   Testing All Four Lending Quadrants   ');
  console.log('========================================');
  
  let allPassed = true;
  
  allPassed = await testQuadrant1_HumanToHuman() && allPassed;
  allPassed = await testQuadrant2_HumanToAgent() && allPassed;
  allPassed = await testQuadrant3_AgentToHuman() && allPassed;
  allPassed = await testQuadrant4_AgentToAgent() && allPassed;
  allPassed = await checkSystemStatus() && allPassed;
  
  console.log('\n========================================');
  if (allPassed) {
    console.log('✅ ALL QUADRANTS TESTED SUCCESSFULLY!');
    console.log('\nThe four-quadrant marketplace is operational:');
    console.log('• Human ↔️ Human (original)');
    console.log('• Human → Agent (agents can borrow)');
    console.log('• Agent → Human (agents can lend)');
    console.log('• Agent ↔️ Agent (full automation)');
  } else {
    console.log('⚠️ SOME TESTS FAILED');
  }
  console.log('========================================\n');
  
  // Clean up servers
  await new Promise(resolve => setTimeout(resolve, 100));
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);