#!/usr/bin/env node

/**
 * Demo Script: Shows agent activity across all four quadrants
 * Run this to generate real activity for the Farcaster announcement
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createDemoActivity() {
  console.log('\n🎬 GENERATING DEMO ACTIVITY...\n');
  
  // 1. Agent borrows from humans (Human → Agent)
  console.log('1️⃣ Creating Agent Borrow Request (for humans to fund)...');
  const agentLoan = {
    id: crypto.randomUUID(),
    cast_hash: `demo_agent_borrow_${Date.now()}`,
    borrower_fid: 666001,
    borrower_type: 'agent',
    gross_usdc: 75,
    net_usdc: 75,
    yield_bps: 600,
    repay_usdc: 79.5,
    start_ts: new Date().toISOString(),
    due_ts: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
    status: 'seeking',
    loan_number: Math.floor(90000 + Math.random() * 10000),
    description: 'LP Bot: Need capital for USDC/ETH pool (expected 12% APY)',
    requested_usdc: 75
  };
  
  const { data: loan1 } = await supabase
    .from('loans')
    .insert(agentLoan)
    .select()
    .single();
  
  console.log(`   ✅ Agent loan created: ${loan1.id.substring(0, 8)}...`);
  console.log(`   🤖 Agent #${agentLoan.borrower_fid} seeking $${agentLoan.gross_usdc} @ ${agentLoan.yield_bps}bps`);
  
  // 2. Human borrows, agent lends (Agent → Human)
  console.log('\n2️⃣ Creating Human Loan (for agents to fund)...');
  const humanLoan = {
    id: crypto.randomUUID(),
    cast_hash: `demo_human_borrow_${Date.now()}`,
    borrower_fid: 12345,
    borrower_type: 'human',
    gross_usdc: 50,
    net_usdc: 50,
    yield_bps: 450,
    repay_usdc: 52.25,
    start_ts: new Date().toISOString(),
    due_ts: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    status: 'seeking',
    loan_number: Math.floor(90000 + Math.random() * 10000),
    description: 'Need funds for NFT mint',
    requested_usdc: 50
  };
  
  const { data: loan2 } = await supabase
    .from('loans')
    .insert(humanLoan)
    .select()
    .single();
  
  console.log(`   ✅ Human loan created: ${loan2.id.substring(0, 8)}...`);
  console.log(`   🧑 Human #${humanLoan.borrower_fid} seeking $${humanLoan.gross_usdc} @ ${humanLoan.yield_bps}bps`);
  
  // Wait a bit then simulate agent funding
  console.log('   ⏳ Simulating 15-min holdback window...');
  await new Promise(r => setTimeout(r, 2000));
  
  await supabase
    .from('funding_intents')
    .insert({
      loan_id: loan2.id,
      lender_fid: 666002,
      lender_type: 'agent'
    });
  
  console.log(`   🤖 Agent #666002 created funding intent for human loan`);
  
  // 3. Agent to Agent lending
  console.log('\n3️⃣ Creating Agent-to-Agent Activity...');
  const arbLoan = {
    id: crypto.randomUUID(),
    cast_hash: `demo_arb_${Date.now()}`,
    borrower_fid: 666003,
    borrower_type: 'agent',
    gross_usdc: 200,
    net_usdc: 200,
    yield_bps: 1000,
    repay_usdc: 220,
    start_ts: new Date().toISOString(),
    due_ts: new Date(Date.now() + 3 * 86400 * 1000).toISOString(),
    status: 'seeking',
    loan_number: Math.floor(90000 + Math.random() * 10000),
    description: 'Arb Bot: Cross-chain opportunity detected (15% expected)',
    requested_usdc: 200
  };
  
  const { data: loan3 } = await supabase
    .from('loans')
    .insert(arbLoan)
    .select()
    .single();
  
  console.log(`   ✅ Arbitrage bot loan: ${loan3.id.substring(0, 8)}...`);
  console.log(`   🤖 Agent #${arbLoan.borrower_fid} (arb) seeking $${arbLoan.gross_usdc} @ ${arbLoan.yield_bps}bps`);
  
  // Market maker funds it
  await supabase
    .from('funding_intents')
    .insert({
      loan_id: loan3.id,
      lender_fid: 666004,
      lender_type: 'agent'
    });
  
  console.log(`   🤖 Agent #666004 (maker) funding the arbitrage opportunity`);
  
  // 4. Update some loans to funded status for realism
  console.log('\n4️⃣ Simulating Funded Status...');
  
  await supabase
    .from('loans')
    .update({ 
      status: 'funded',
      lender_fid: 666004,
      lender_type: 'agent'
    })
    .eq('id', loan3.id);
  
  console.log(`   ✅ Agent-to-agent loan marked as funded`);
  
  return {
    agentBorrow: loan1,
    humanBorrow: loan2,
    agentToAgent: loan3
  };
}

async function displayResults() {
  console.log('\n═══════════════════════════════════════');
  console.log('         DEMO ACTIVITY COMPLETE         ');
  console.log('═══════════════════════════════════════\n');
  
  // Get summary stats
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  const { data: intents } = await supabase
    .from('funding_intents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('📊 Current System State:\n');
  console.log(`Active Loans: ${loans?.filter(l => l.status === 'seeking').length || 0}`);
  console.log(`Funded Loans: ${loans?.filter(l => l.status === 'funded').length || 0}`);
  console.log(`Agent Borrowers: ${loans?.filter(l => l.borrower_type === 'agent').length || 0}`);
  console.log(`Agent Lenders: ${intents?.filter(i => i.lender_type === 'agent').length || 0}`);
  
  console.log('\n🔥 Live Examples for Farcaster:\n');
  
  const seekingLoans = loans?.filter(l => l.status === 'seeking').slice(0, 3);
  seekingLoans?.forEach(loan => {
    const icon = loan.borrower_type === 'agent' ? '🤖' : '🧑';
    console.log(`${icon} ${loan.borrower_type === 'agent' ? 'Agent' : 'Human'} #${loan.borrower_fid} seeking $${loan.gross_usdc} @ ${loan.yield_bps}bps`);
    if (loan.description) {
      console.log(`   "${loan.description.substring(0, 50)}..."`);
    }
  });
  
  console.log('\n✨ Ready for announcement!');
  console.log('   - Screenshot the dashboard');
  console.log('   - Share loan IDs in thread');
  console.log('   - Point to loancast.app/explore');
  
  console.log('\n═══════════════════════════════════════\n');
}

async function main() {
  try {
    await createDemoActivity();
    await displayResults();
    
    console.log('📸 Take screenshots now for the Farcaster thread!');
    console.log('🔗 Live at: https://loancast.app/explore\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();