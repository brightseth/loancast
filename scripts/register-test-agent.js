#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function registerTestAgent(agentFid, agentType = 'lp') {
  console.log(`\nRegistering agent ${agentFid} (${agentType})...`);
  
  const agentData = {
    agent_fid: agentFid,
    controller_fid: 12345,
    wallet: '0x' + agentFid.toString(16).padStart(40, '0'),
    agent_type: agentType,
    strategy: { 
      test: true,
      riskTolerance: 'moderate',
      maxLoanAmount: 100
    },
    strategy_hash: 'test_hash_' + agentFid,
    policy: { 
      daily_usdc_cap: 1000,
      per_tx_cap: 700,
      per_counterparty_cap: 500,
      allow_autofund: true
    },
    verified_at: new Date().toISOString(),
    active: true
  };
  
  // Register agent
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .upsert(agentData)
    .eq('agent_fid', agentFid)
    .select()
    .single();
  
  if (agentError) {
    console.error('❌ Failed to register agent:', agentError.message);
    return false;
  }
  
  console.log('✅ Agent registered successfully');
  
  // Create session token
  const sessionHash = 'test_session_' + agentFid + '_' + Date.now();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const { data: session, error: sessionError } = await supabase
    .from('agent_sessions')
    .insert({
      agent_fid: agentFid,
      session_hash: sessionHash,
      expires_at: expiresAt
    })
    .select()
    .single();
  
  if (sessionError) {
    console.error('❌ Failed to create session:', sessionError.message);
    return false;
  }
  
  console.log('✅ Session created:', sessionHash);
  
  // Check if stats and limits were created
  const { data: stats } = await supabase
    .from('agent_stats')
    .select('*')
    .eq('agent_fid', agentFid)
    .single();
  
  const { data: limits } = await supabase
    .from('agent_limits')
    .select('*')
    .eq('agent_fid', agentFid)
    .single();
  
  console.log('Stats created:', stats ? '✅' : '❌');
  console.log('Limits created:', limits ? '✅' : '❌');
  
  return {
    agent_fid: agentFid,
    session_token: sessionHash,
    wallet: agentData.wallet
  };
}

async function main() {
  console.log('========================================');
  console.log('    Registering Test Agents    ');
  console.log('========================================');
  
  // Register multiple test agents
  const agents = [
    { fid: 666001, type: 'lp' },      // LP agent
    { fid: 666002, type: 'yield' },   // Yield farmer
    { fid: 666003, type: 'arb' },     // Arbitrage bot
    { fid: 666004, type: 'maker' }    // Market maker
  ];
  
  const registered = [];
  
  for (const { fid, type } of agents) {
    const result = await registerTestAgent(fid, type);
    if (result) {
      registered.push(result);
    }
  }
  
  console.log('\n========================================');
  console.log('Summary:');
  console.log(`Registered ${registered.length} agents successfully`);
  
  if (registered.length > 0) {
    console.log('\nTest agent credentials:');
    registered.forEach(agent => {
      console.log(`\nAgent FID: ${agent.agent_fid}`);
      console.log(`Session Token: ${agent.session_token}`);
      console.log(`Wallet: ${agent.wallet}`);
    });
  }
  
  console.log('========================================\n');
}

main().catch(console.error);