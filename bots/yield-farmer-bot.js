#!/usr/bin/env node

/**
 * Yield Farmer Bot
 * Strategy: Lends to humans with good credit scores for steady yield
 * Target: 300-500 bps on short-term loans
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const BOT_CONFIG = {
  agent_fid: 666002,
  session_token: 'test_session_666002_1755328232447',
  strategy: {
    minScore: 600,
    maxLoanAmount: 50,
    maxDuration: 30,
    targetYield: 400, // bps
    dailyLimit: 200,  // USDC
    mockCreditScore: 650 // Configurable for testing
  }
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function scanForOpportunities() {
  console.log('🌾 Yield Farmer scanning for opportunities...');
  
  // Find human loans seeking funding
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_type', 'human')
    .eq('status', 'seeking')
    .gte('yield_bps', BOT_CONFIG.strategy.targetYield)
    .lte('gross_usdc', BOT_CONFIG.strategy.maxLoanAmount)
    .order('yield_bps', { ascending: false })
    .limit(5);
  
  if (!loans || loans.length === 0) {
    console.log('   No suitable loans found');
    return;
  }
  
  console.log(`   Found ${loans.length} potential loans`);
  
  for (const loan of loans) {
    // Check if loan is past holdback window (15 min)
    const loanAge = Date.now() - new Date(loan.created_at).getTime();
    const holdbackMs = 15 * 60 * 1000;
    
    if (loanAge < holdbackMs) {
      const remainingMin = Math.ceil((holdbackMs - loanAge) / 60000);
      console.log(`   ⏳ Loan ${loan.id.substring(0, 8)} in holdback (${remainingMin}min remaining)`);
      continue;
    }
    
    // Simulate credit check (would integrate with real scoring)
    const creditScore = BOT_CONFIG.strategy.mockCreditScore || 650; // Configurable mock score
    
    if (creditScore >= BOT_CONFIG.strategy.minScore) {
      console.log(`   ✅ Funding loan ${loan.id.substring(0, 8)}: $${loan.gross_usdc} @ ${loan.yield_bps}bps`);
      
      // Record funding intent
      await supabase
        .from('funding_intents')
        .insert({
          loan_id: loan.id,
          lender_fid: BOT_CONFIG.agent_fid,
          lender_type: 'agent'
        });
      
      // Update agent stats
      const { data: currentStats } = await supabase
        .from('agent_stats')
        .select('loans_funded')
        .eq('agent_fid', BOT_CONFIG.agent_fid)
        .single();
      
      await supabase
        .from('agent_stats')
        .update({ 
          loans_funded: (currentStats?.loans_funded || 0) + 1,
          last_active: new Date().toISOString()
        })
        .eq('agent_fid', BOT_CONFIG.agent_fid);
      
      // In production: execute on-chain funding transaction
      console.log('   📝 Funding intent recorded (would execute on-chain)');
      break; // Fund one at a time for demo
    }
  }
}

async function reportPerformance() {
  const { data: stats } = await supabase
    .from('agent_stats')
    .select('*')
    .eq('agent_fid', BOT_CONFIG.agent_fid)
    .single();
  
  console.log('\n📊 Yield Farmer Performance:');
  console.log(`   Loans Funded: ${stats?.loans_funded || 0}`);
  console.log(`   Credit Score: ${stats?.score || 500}`);
  console.log(`   Last Active: ${stats?.last_active || 'Never'}`);
}

async function run() {
  console.log('═══════════════════════════════════════');
  console.log('     YIELD FARMER BOT ACTIVATED 🌾      ');
  console.log('═══════════════════════════════════════');
  console.log(`Agent FID: ${BOT_CONFIG.agent_fid}`);
  console.log(`Strategy: ${BOT_CONFIG.strategy.targetYield}bps on human loans`);
  console.log(`Max Amount: $${BOT_CONFIG.strategy.maxLoanAmount}`);
  console.log('\n');
  
  // Run continuously
  while (true) {
    await scanForOpportunities();
    await reportPerformance();
    
    // Wait 60 seconds before next scan
    console.log('\n⏰ Next scan in 60 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Yield Farmer shutting down...');
  process.exit(0);
});

// Start the bot
if (require.main === module) {
  run().catch(console.error);
}

module.exports = { BOT_CONFIG, scanForOpportunities };