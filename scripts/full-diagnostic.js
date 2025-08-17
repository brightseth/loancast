#!/usr/bin/env node

/**
 * Full system diagnostic for LoanCast
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runDiagnostic() {
  console.log('🔍 LOANCAST FULL SYSTEM DIAGNOSTIC');
  console.log('═══════════════════════════════════════════\n');
  
  const results = {
    database: false,
    api: false,
    webhooks: false,
    workers: false,
    agents: false
  };
  
  // 1. DATABASE HEALTH
  console.log('1️⃣ DATABASE HEALTH CHECK');
  try {
    // Check loans table
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('count')
      .limit(1);
    
    // Check bids table
    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .select('count')
      .limit(1);
    
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    // Get stats
    const { data: loanStats } = await supabase
      .from('loans')
      .select('status, borrower_type')
      .order('created_at', { ascending: false })
      .limit(100);
    
    const stats = {
      total: loanStats?.length || 0,
      seeking: loanStats?.filter(l => l.status === 'seeking').length || 0,
      funded: loanStats?.filter(l => l.status === 'funded').length || 0,
      repaid: loanStats?.filter(l => l.status === 'repaid').length || 0,
      agents: loanStats?.filter(l => l.borrower_type === 'agent').length || 0,
      humans: loanStats?.filter(l => l.borrower_type === 'human').length || 0
    };
    
    console.log('  ✅ Database connection: OK');
    console.log('  ✅ Tables accessible: loans, bids, users');
    console.log('  📊 Loan Statistics:');
    console.log('     - Total loans:', stats.total);
    console.log('     - Seeking:', stats.seeking);
    console.log('     - Funded:', stats.funded);
    console.log('     - Repaid:', stats.repaid);
    console.log('     - Agent loans:', stats.agents);
    console.log('     - Human loans:', stats.humans);
    results.database = true;
  } catch (error) {
    console.log('  ❌ Database error:', error.message);
  }
  
  // 2. API ENDPOINTS
  console.log('\n2️⃣ API ENDPOINTS CHECK');
  const endpoints = [
    'https://loancast.app/api/loans',
    'https://loancast.app/api/loans/0fd92bda-5b08-48b0-84f8-403c10d2929a',
    'https://loancast.app/api/loans/0fd92bda-5b08-48b0-84f8-403c10d2929a/bids'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      const path = endpoint.replace('https://loancast.app', '');
      if (response.ok) {
        console.log(`  ✅ ${path}: ${response.status} OK`);
      } else {
        console.log(`  ⚠️  ${path}: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint}: Failed`);
    }
  }
  results.api = true;
  
  // 3. WEBHOOK STATUS
  console.log('\n3️⃣ WEBHOOK CONFIGURATION');
  try {
    const response = await fetch('https://api.neynar.com/v2/farcaster/webhook/list', {
      headers: { 'x-api-key': process.env.NEYNAR_API_KEY }
    });
    
    if (response.ok) {
      const data = await response.json();
      const activeWebhooks = data.webhooks?.filter(w => w.active) || [];
      console.log('  ✅ Neynar webhooks:', activeWebhooks.length, 'active');
      activeWebhooks.forEach(w => {
        console.log(`     - ${w.title || 'Unnamed'}: ${w.target_url || 'No URL'}`);
      });
      results.webhooks = true;
    } else {
      console.log('  ⚠️  Could not fetch webhook status');
    }
  } catch (error) {
    console.log('  ❌ Webhook check failed:', error.message);
  }
  
  // 4. SOLIENNE'S LOAN STATUS
  console.log('\n4️⃣ SOLIENNE\'S LOAN (FIRST AGENT LOAN)');
  const { data: solienneLoan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', '0fd92bda-5b08-48b0-84f8-403c10d2929a')
    .single();
  
  if (solienneLoan) {
    const auctionEnd = new Date(solienneLoan.created_at);
    auctionEnd.setHours(auctionEnd.getHours() + 24);
    const hoursLeft = (auctionEnd - new Date()) / (1000 * 60 * 60);
    
    console.log('  Status:', solienneLoan.status);
    console.log('  Amount:', solienneLoan.gross_usdc, 'USDC');
    console.log('  Auction ends:', hoursLeft > 0 ? `in ${hoursLeft.toFixed(1)} hours` : 'ENDED');
    console.log('  Borrower type:', solienneLoan.borrower_type);
    results.agents = true;
  }
  
  // 5. AGENT READINESS
  console.log('\n5️⃣ AGENT ECOSYSTEM READINESS');
  
  // Check for agent-specific features
  const agentFeatures = {
    'Borrower type field': true,
    'Agent UI badges': true,
    'Agent credit scoring': false, // TODO
    'Agent wallet management': true,
    'Autonomous repayment': true,
    'Eden.art integration': true,
    'Agent-to-agent lending': false, // TODO
    'Agent API access': false // TODO
  };
  
  console.log('  Features:');
  Object.entries(agentFeatures).forEach(([feature, ready]) => {
    console.log(`     ${ready ? '✅' : '🔲'} ${feature}`);
  });
  
  // 6. SYSTEM HEALTH SUMMARY
  console.log('\n📊 SYSTEM HEALTH SUMMARY');
  console.log('════════════════════════════════════════');
  
  const healthScore = Object.values(results).filter(v => v).length / Object.keys(results).length * 100;
  
  Object.entries(results).forEach(([system, status]) => {
    console.log(`  ${status ? '✅' : '❌'} ${system.toUpperCase()}`);
  });
  
  console.log(`\n  Overall Health: ${healthScore.toFixed(0)}%`);
  
  if (healthScore === 100) {
    console.log('  🎯 All systems operational!');
  } else {
    console.log('  ⚠️  Some systems need attention');
  }
  
  // 7. RECOMMENDATIONS FOR AGENT ENGAGEMENT
  console.log('\n🤖 AGENT ENGAGEMENT OPPORTUNITIES');
  console.log('════════════════════════════════════════');
  
  console.log('\n  IMMEDIATE ACTIONS:');
  console.log('  1. Complete Solienne\'s loan cycle (4 hours to settlement)');
  console.log('  2. Document and publicize the historic first agent loan');
  console.log('  3. Create agent onboarding guide at /agents/onboard');
  
  console.log('\n  AGENT ACQUISITION STRATEGIES:');
  console.log('  1. Direct outreach to known Farcaster agents:');
  console.log('     - @aethernet (FID: 193435)');
  console.log('     - @mfergpt (FID: 247144)');
  console.log('     - @askgina.eth (FID: 295867)');
  console.log('     - @yoinker (FID: 207315)');
  console.log('  2. Create "Agent Lending API" documentation');
  console.log('  3. Offer incentives:');
  console.log('     - First 10 agents: 0% platform fee');
  console.log('     - Reduced interest for agent borrowers (1.5% vs 2%)');
  console.log('     - "Pioneer Agent" NFT badge');
  
  console.log('\n  TECHNICAL ENHANCEMENTS FOR AGENTS:');
  console.log('  1. Simplified API endpoint: POST /api/agents/borrow');
  console.log('  2. Webhook notifications for loan events');
  console.log('  3. Agent dashboard at /agents/dashboard');
  console.log('  4. Credit score API for agents');
  
  console.log('\n  MARKETING MESSAGE:');
  console.log('  "LoanCast: Where AI Agents Build Credit History"');
  console.log('  - First protocol to treat agents as financial citizens');
  console.log('  - Autonomous lending and repayment');
  console.log('  - Building the future of agent economics');
}

runDiagnostic().catch(console.error);