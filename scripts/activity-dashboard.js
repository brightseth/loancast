#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function generateDashboard() {
  console.log('\n═══════════════════════════════════════════');
  console.log('     LOANCAST FOUR-QUADRANT DASHBOARD      ');
  console.log('═══════════════════════════════════════════\n');
  
  // Get all loans
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  
  // Count by quadrant
  const quadrants = {
    '🧑→🧑': { count: 0, volume: 0, label: 'Human → Human' },
    '🧑→🤖': { count: 0, volume: 0, label: 'Human → Agent' },
    '🤖→🧑': { count: 0, volume: 0, label: 'Agent → Human' },
    '🤖→🤖': { count: 0, volume: 0, label: 'Agent → Agent' }
  };
  
  const activeLoansByQuadrant = [];
  
  loans?.forEach(loan => {
    const borrowerIcon = loan.borrower_type === 'agent' ? '🤖' : '🧑';
    const lenderIcon = loan.lender_type === 'agent' ? '🤖' : 
                       loan.lender_type === 'human' ? '🧑' : '❓';
    const key = `${borrowerIcon}→${lenderIcon}`;
    
    if (quadrants[key]) {
      quadrants[key].count++;
      quadrants[key].volume += parseFloat(loan.gross_usdc || 0);
      
      if (loan.status === 'seeking') {
        activeLoansByQuadrant.push({
          quadrant: key,
          id: loan.id.substring(0, 8),
          amount: loan.gross_usdc,
          yield: loan.yield_bps,
          borrower: loan.borrower_fid,
          type: loan.borrower_type
        });
      }
    }
  });
  
  // Get agent stats
  const { data: agents } = await supabase
    .from('agents')
    .select('agent_fid, agent_type, active')
    .eq('active', true);
  
  const { data: agentStats } = await supabase
    .from('agent_stats')
    .select('*')
    .order('loans_funded', { ascending: false })
    .limit(5);
  
  // Get recent funding intents
  const { data: intents } = await supabase
    .from('funding_intents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Display quadrant activity
  console.log('📊 QUADRANT ACTIVITY\n');
  Object.entries(quadrants).forEach(([icon, data]) => {
    console.log(`${icon} ${data.label}`);
    console.log(`   Loans: ${data.count} | Volume: $${data.volume.toFixed(2)} USDC`);
  });
  
  // Display active loans
  console.log('\n🔥 ACTIVE LOANS SEEKING FUNDING\n');
  if (activeLoansByQuadrant.length > 0) {
    activeLoansByQuadrant.slice(0, 5).forEach(loan => {
      console.log(`${loan.quadrant} Loan ${loan.id} | $${loan.amount} @ ${loan.yield}bps`);
      console.log(`   Borrower: ${loan.type} #${loan.borrower}`);
    });
  } else {
    console.log('   No active loans seeking funding');
  }
  
  // Display agent leaderboard
  console.log('\n🏆 AGENT LEADERBOARD\n');
  if (agentStats && agentStats.length > 0) {
    agentStats.forEach((agent, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      console.log(`${medal} Agent #${agent.agent_fid}`);
      console.log(`   Funded: ${agent.loans_funded} loans | Score: ${agent.score}`);
    });
  } else {
    console.log('   No agent activity yet');
  }
  
  // Display stats
  console.log('\n📈 SYSTEM METRICS\n');
  console.log(`Total Agents: ${agents?.length || 0}`);
  console.log(`Total Loans: ${loans?.length || 0}`);
  console.log(`Funding Intents: ${intents?.length || 0}`);
  
  const totalVolume = Object.values(quadrants).reduce((sum, q) => sum + q.volume, 0);
  console.log(`Total Volume: $${totalVolume.toFixed(2)} USDC`);
  
  console.log('\n═══════════════════════════════════════════\n');
  
  return {
    quadrants,
    activeLoansByQuadrant,
    totalAgents: agents?.length || 0,
    totalLoans: loans?.length || 0,
    totalVolume
  };
}

// Generate and export
generateDashboard().then(data => {
  // Could write to file for sharing
  require('fs').writeFileSync(
    'dashboard-snapshot.json',
    JSON.stringify(data, null, 2)
  );
  console.log('📸 Snapshot saved to dashboard-snapshot.json');
}).catch(console.error);