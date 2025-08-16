#!/usr/bin/env node

/**
 * Prepare everything for the Farcaster announcement
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function generateStats() {
  // Get current metrics
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .order('created_at', { ascending: false });
  
  const { data: agents } = await supabase
    .from('agents')
    .select('*');
  
  const { data: intents } = await supabase
    .from('funding_intents')
    .select('*');
  
  // Calculate quadrant activity
  let humanToHuman = 0, humanToAgent = 0, agentToHuman = 0, agentToAgent = 0;
  let totalVolume = 0;
  
  loans?.forEach(loan => {
    if (loan.status === 'funded' && loan.lender_type) {
      const volume = parseFloat(loan.gross_usdc || 0);
      totalVolume += volume;
      
      if (loan.borrower_type === 'human' && loan.lender_type === 'human') humanToHuman++;
      else if (loan.borrower_type === 'human' && loan.lender_type === 'agent') agentToHuman++;
      else if (loan.borrower_type === 'agent' && loan.lender_type === 'human') humanToAgent++;
      else if (loan.borrower_type === 'agent' && loan.lender_type === 'agent') agentToAgent++;
    }
  });
  
  const activeLoanExamples = loans
    ?.filter(l => l.status === 'seeking')
    .slice(0, 3)
    .map(l => ({
      id: l.id.substring(0, 8),
      type: l.borrower_type,
      fid: l.borrower_fid,
      amount: l.gross_usdc,
      yield: l.yield_bps,
      description: l.description?.substring(0, 40)
    }));
  
  return {
    totalAgents: agents?.length || 0,
    totalLoans: loans?.length || 0,
    fundingIntents: intents?.length || 0,
    totalVolume: totalVolume.toFixed(2),
    quadrants: { humanToHuman, humanToAgent, agentToHuman, agentToAgent },
    activeLoanExamples
  };
}

async function prepareAnnouncement() {
  console.log('📣 PREPARING FARCASTER ANNOUNCEMENT\n');
  
  const stats = await generateStats();
  
  console.log('📊 Current Metrics:');
  console.log(`   • ${stats.totalAgents} Active Agents`);
  console.log(`   • ${stats.totalLoans} Total Loans`);
  console.log(`   • $${stats.totalVolume} Total Volume`);
  console.log(`   • ${stats.fundingIntents} Funding Intents\n`);
  
  console.log('🎯 Quadrant Activity:');
  console.log(`   • Human→Human: ${stats.quadrants.humanToHuman} loans`);
  console.log(`   • Human→Agent: ${stats.quadrants.humanToAgent} loans`);
  console.log(`   • Agent→Human: ${stats.quadrants.agentToHuman} loans`);
  console.log(`   • Agent→Agent: ${stats.quadrants.agentToAgent} loans\n`);
  
  if (stats.activeLoanExamples?.length > 0) {
    console.log('🔥 Live Loan Examples for Thread:');
    stats.activeLoanExamples.forEach(loan => {
      const icon = loan.type === 'agent' ? '🤖' : '🧑';
      console.log(`   ${icon} ${loan.type === 'agent' ? 'Agent' : 'Human'} #${loan.fid} seeking $${loan.amount} @ ${loan.yield}bps`);
      if (loan.description) {
        console.log(`      "${loan.description}..."`);
      }
    });
  }
  
  // Generate cast with real numbers
  const cast4Updated = `LIVE NOW:

${stats.activeLoanExamples?.map(loan => {
  const icon = loan.type === 'agent' ? '🤖' : '🧑';
  return `${icon} ${loan.type === 'agent' ? 'Agent' : 'Human'} #${loan.fid} seeking ${loan.amount} USDC @ ${loan.yield}bps`;
}).join('\n')}

Agents compete on yield. Humans get priority (15min holdback).

Watch it happen: loancast.app/explore`;
  
  console.log('\n📝 Updated Cast 4 (with real data):');
  console.log('─'.repeat(50));
  console.log(cast4Updated);
  console.log('─'.repeat(50));
  
  // Save updated stats
  fs.writeFileSync(
    path.join(__dirname, '../announcement-stats.json'),
    JSON.stringify(stats, null, 2)
  );
  
  console.log('\n✅ Stats saved to announcement-stats.json');
  
  // Checklist
  console.log('\n📋 LAUNCH CHECKLIST:');
  console.log('   [ ] Run bots: node scripts/run-demo-bots.js');
  console.log('   [ ] Take screenshot of loancast.app/explore');
  console.log('   [ ] Take screenshot of the quadrant visual');
  console.log('   [ ] Post thread from farcaster-announcement.md');
  console.log('   [ ] Update Cast 4 with the real data above');
  console.log('   [ ] Add visual to Cast 1');
  console.log('   [ ] End with: "Reply with your agent idea"');
  
  console.log('\n🚀 Ready to announce!');
}

prepareAnnouncement().catch(console.error);