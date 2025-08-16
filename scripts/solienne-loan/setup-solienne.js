#!/usr/bin/env node

/**
 * Setup Solienne as an Agent Borrower
 * FID: 1113468
 * This creates the first Human→Agent loan on LoanCast
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SOLIENNE_CONFIG = {
  fid: 1113468,
  name: 'Solienne',
  wallet: process.env.SOLIENNE_WALLET || '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9', // Solienne's actual wallet
  type: 'maker',
  description: 'AI artist and creator, borrowing for print runs',
  strategy: {
    purpose: 'working_capital',
    description: 'Funding for Solienne print runs and creative projects',
    targetBorrow: 50,
    preferredRate: 500 // 5%
  },
  policy: {
    daily_usdc_cap: 500,
    allow_autofund: false
  }
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupSolienne() {
  console.log('\n🎨 SETTING UP SOLIENNE AS AGENT BORROWER\n');
  
  // Register or update Solienne as agent
  const { data: agent, error } = await supabase
    .from('agents')
    .upsert({
      agent_fid: SOLIENNE_CONFIG.fid,
      controller_fid: SOLIENNE_CONFIG.fid, // Self-controlled
      wallet: SOLIENNE_CONFIG.wallet,
      agent_type: SOLIENNE_CONFIG.type,
      strategy: SOLIENNE_CONFIG.strategy,
      strategy_hash: 'solienne_v1',
      policy: SOLIENNE_CONFIG.policy,
      verified_at: new Date().toISOString(),
      active: true
    })
    .eq('agent_fid', SOLIENNE_CONFIG.fid)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to register Solienne:', error.message);
    return false;
  }
  
  console.log('✅ Solienne registered as agent');
  console.log(`   FID: ${SOLIENNE_CONFIG.fid}`);
  console.log(`   Wallet: ${SOLIENNE_CONFIG.wallet}`);
  console.log(`   Type: ${SOLIENNE_CONFIG.type}`);
  console.log(`   Purpose: ${SOLIENNE_CONFIG.description}`);
  
  // Ensure stats exist
  await supabase
    .from('agent_stats')
    .upsert({
      agent_fid: SOLIENNE_CONFIG.fid,
      loans_funded: 0,
      loans_repaid: 0,
      score: 700 // Good starting score for Solienne
    })
    .eq('agent_fid', SOLIENNE_CONFIG.fid);
  
  // Ensure limits exist  
  await supabase
    .from('agent_limits')
    .upsert({
      agent_fid: SOLIENNE_CONFIG.fid,
      daily_loans_funded: 0,
      daily_usdc_funded_6: 0
    })
    .eq('agent_fid', SOLIENNE_CONFIG.fid);
  
  return true;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('    SOLIENNE AGENT SETUP');
  console.log('═══════════════════════════════════════════');
  
  const success = await setupSolienne();
  
  if (success) {
    console.log('\n✅ Solienne is ready to borrow as an agent!');
    console.log('\nNext steps:');
    console.log('1. Run create-loan.js to post her loan request');
    console.log('2. Fund it as a human (you)');
    console.log('3. Run repay-worker.js when due');
    console.log('\nThis will be the first Human→Agent loan!');
  }
}

main().catch(console.error);