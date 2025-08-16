#!/usr/bin/env node

/**
 * Setup Script for Autonomous Agents
 * Registers Alpha and Beta in the database with their wallets
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Load agent configurations
require('dotenv').config({ path: path.join(__dirname, '.env.alpha') });
const ALPHA_WALLET = process.env.ALPHA_WALLET_ADDRESS;

require('dotenv').config({ path: path.join(__dirname, '.env.beta') });
const BETA_WALLET = process.env.BETA_WALLET_ADDRESS;

async function setupAgent(config) {
  console.log(`\nSetting up ${config.name}...`);
  
  // Register agent
  const { data: agent, error } = await supabase
    .from('agents')
    .upsert({
      agent_fid: config.fid,
      controller_fid: 12345, // Your FID
      wallet: config.wallet,
      agent_type: config.type,
      strategy: config.strategy,
      strategy_hash: `${config.name.toLowerCase()}_strategy_v1`,
      policy: config.policy,
      verified_at: new Date().toISOString(),
      active: true
    })
    .eq('agent_fid', config.fid)
    .select()
    .single();
  
  if (error) {
    console.error(`❌ Failed to register ${config.name}:`, error.message);
    return false;
  }
  
  // Ensure stats exist
  await supabase
    .from('agent_stats')
    .upsert({
      agent_fid: config.fid,
      loans_funded: 0,
      loans_repaid: 0,
      score: 500
    })
    .eq('agent_fid', config.fid);
  
  // Ensure limits exist
  await supabase
    .from('agent_limits')
    .upsert({
      agent_fid: config.fid,
      daily_loans_funded: 0,
      daily_usdc_funded_6: 0
    })
    .eq('agent_fid', config.fid);
  
  console.log(`✅ ${config.name} registered`);
  console.log(`   FID: ${config.fid}`);
  console.log(`   Wallet: ${config.wallet}`);
  console.log(`   Type: ${config.type}`);
  
  return true;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('    AUTONOMOUS AGENTS SETUP');
  console.log('═══════════════════════════════════════════');
  
  if (!ALPHA_WALLET || !BETA_WALLET) {
    console.error('\n❌ Missing wallet addresses!');
    console.error('Please create .env.alpha and .env.beta files');
    console.error('with wallet addresses and private keys.');
    process.exit(1);
  }
  
  // Define agents
  const agents = [
    {
      name: 'Agent-Alpha',
      fid: 666001,
      wallet: ALPHA_WALLET,
      type: 'arb',
      strategy: {
        role: 'borrower',
        description: 'Arbitrage bot that borrows for DEX opportunities',
        targetReturn: 1500,
        maxBorrowCost: 1000
      },
      policy: {
        daily_usdc_cap: 1000,
        allow_autofund: false
      }
    },
    {
      name: 'Agent-Beta',
      fid: 666003,
      wallet: BETA_WALLET,
      type: 'maker',
      strategy: {
        role: 'lender',
        description: 'Market maker that lends for yield',
        minYield: 500,
        maxLoanSize: 200
      },
      policy: {
        daily_usdc_cap: 2000,
        allow_autofund: true
      }
    }
  ];
  
  // Setup both agents
  let success = true;
  for (const agent of agents) {
    success = await setupAgent(agent) && success;
  }
  
  if (success) {
    console.log('\n═══════════════════════════════════════════');
    console.log('    ✅ AGENTS READY FOR AUTONOMOUS OPERATION');
    console.log('═══════════════════════════════════════════');
    console.log('\nNext steps:');
    console.log('1. Fund Beta\'s wallet with USDC on Base');
    console.log('2. Run Alpha: node agent-alpha.js');
    console.log('3. Run Beta: node agent-beta.js (different terminal)');
    console.log('4. Watch history being made!');
    console.log('\nRemember:');
    console.log('- Run on different servers for true independence');
    console.log('- Save all transaction hashes');
    console.log('- Document everything for provenance');
  }
}

main().catch(console.error);