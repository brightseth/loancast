#!/usr/bin/env node

/**
 * Setup the historic agents that will execute the first autonomous loan
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupHistoricAgents() {
  console.log('\n🏛️ SETTING UP HISTORIC AGENTS\n');
  
  // Define the two historic agents
  const agents = [
    {
      agent_fid: 666003,
      controller_fid: 12345,
      wallet: '0x' + '666003'.toString(16).padStart(40, '0'),
      agent_type: 'arb',
      strategy: {
        name: 'Cross-DEX Arbitrageur',
        description: 'Exploits price discrepancies across DEXs',
        targetReturn: 1500,
        maxBorrowCost: 1000,
        preferredDuration: 1
      },
      policy: {
        daily_usdc_cap: 1000,
        per_tx_cap: 500,
        allow_autofund: true
      },
      description: 'The Borrower - First agent to request a loan from another agent'
    },
    {
      agent_fid: 666004,
      controller_fid: 12345,
      wallet: '0x' + '666004'.toString(16).padStart(40, '0'),
      agent_type: 'maker',
      strategy: {
        name: 'Yield Optimizer',
        description: 'Provides liquidity for consistent returns',
        minYield: 500,
        maxLoanSize: 500,
        maxDuration: 7
      },
      policy: {
        daily_usdc_cap: 2000,
        per_tx_cap: 1000,
        allow_autofund: true
      },
      description: 'The Lender - First agent to fund another agent\'s loan'
    }
  ];
  
  for (const agentConfig of agents) {
    console.log(`Setting up ${agentConfig.description}...`);
    console.log(`   Agent #${agentConfig.agent_fid} (${agentConfig.agent_type})`);
    
    // Upsert agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .upsert({
        agent_fid: agentConfig.agent_fid,
        controller_fid: agentConfig.controller_fid,
        wallet: agentConfig.wallet,
        agent_type: agentConfig.agent_type,
        strategy: agentConfig.strategy,
        strategy_hash: `historic_${agentConfig.agent_fid}`,
        policy: agentConfig.policy,
        verified_at: new Date().toISOString(),
        active: true
      })
      .eq('agent_fid', agentConfig.agent_fid)
      .select()
      .single();
    
    if (agentError) {
      console.error(`   ❌ Failed to setup agent:`, agentError);
      continue;
    }
    
    // Ensure stats exist
    await supabase
      .from('agent_stats')
      .upsert({
        agent_fid: agentConfig.agent_fid,
        loans_funded: 0,
        total_funded_usdc_6: 0,
        loans_repaid: 0,
        loans_defaulted: 0,
        default_rate_bps: 0,
        avg_yield_bps: 0,
        score: 500,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      })
      .eq('agent_fid', agentConfig.agent_fid);
    
    // Ensure limits exist
    await supabase
      .from('agent_limits')
      .upsert({
        agent_fid: agentConfig.agent_fid,
        daily_loans_funded: 0,
        daily_usdc_funded_6: 0,
        last_reset_at: new Date().toISOString()
      })
      .eq('agent_fid', agentConfig.agent_fid);
    
    console.log(`   ✅ Agent #${agentConfig.agent_fid} ready`);
    console.log(`   Strategy: ${agentConfig.strategy.name}`);
    console.log(`   Wallet: ${agentConfig.wallet.substring(0, 10)}...`);
    console.log('');
  }
  
  // Verify both agents are ready
  const { data: verifyAgents } = await supabase
    .from('agents')
    .select('agent_fid, agent_type, active')
    .in('agent_fid', [666003, 666004]);
  
  if (verifyAgents && verifyAgents.length === 2) {
    console.log('✅ BOTH HISTORIC AGENTS ARE READY!\n');
    console.log('Agent #666003 (Arbitrage Bot) - The Borrower');
    console.log('Agent #666004 (Market Maker) - The Lender');
    console.log('\nThey are ready to make history.');
    return true;
  } else {
    console.error('❌ Failed to setup both agents');
    return false;
  }
}

async function cleanPreviousAttempts() {
  console.log('Cleaning any previous test loans...\n');
  
  // Delete test loans between these agents
  await supabase
    .from('loans')
    .delete()
    .eq('borrower_fid', 666003)
    .eq('lender_fid', 666004);
  
  // Reset agent stats
  await supabase
    .from('agent_stats')
    .update({
      loans_funded: 0,
      loans_repaid: 0,
      score: 500
    })
    .in('agent_fid', [666003, 666004]);
  
  console.log('✅ Clean slate ready for historic moment\n');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('         PREPARING FOR HISTORIC MOMENT');
  console.log('═══════════════════════════════════════════════════════');
  
  await cleanPreviousAttempts();
  const ready = await setupHistoricAgents();
  
  if (ready) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('              AGENTS READY FOR HISTORY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nNext step:');
    console.log('Run: node bots/autonomous-loan-cycle.js');
    console.log('\nThis will execute the first autonomous loan cycle.');
    console.log('═══════════════════════════════════════════════════════\n');
  }
}

main().catch(console.error);