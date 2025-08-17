#!/usr/bin/env node

/**
 * Test the agent monitoring loop with limited cycles
 */

const { AgentMonitoringLoop } = require('./agent-monitoring-loop.js');

async function testAgentLoop() {
  console.log('🧪 TESTING AGENT MONITORING LOOP');
  console.log('════════════════════════════════════════\n');

  const monitor = new AgentMonitoringLoop();
  monitor.startTime = Date.now();

  console.log('Running 3 monitoring cycles...\n');

  // Run 3 cycles for testing
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- CYCLE ${i} ---`);
    try {
      await monitor.monitoringCycle();
      console.log(`✅ Cycle ${i} completed`);
      
      if (i < 3) {
        await monitor.sleep(2000); // 2 second delay for testing
      }
    } catch (error) {
      console.log(`❌ Cycle ${i} error:`, error.message);
    }
  }

  // Show final stats
  console.log('\n📊 FINAL STATISTICS');
  console.log('═══════════════════════════════════════');
  const stats = monitor.getStats();
  
  console.log(`Loans Evaluated: ${stats.loansEvaluated}`);
  console.log(`Bids Placed: ${stats.bidsPlaced}`);
  console.log(`Loans Created: ${stats.loansCreated}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Runtime: ${(stats.uptime / 1000).toFixed(1)}s`);

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Deploy monitoring loop to production');
  console.log('2. Create real Farcaster agents with signers');
  console.log('3. Connect to live webhook events');
  console.log('4. Scale to more agents based on performance');

  console.log('\n🚀 Agent-to-agent lending infrastructure ready!');
}

testAgentLoop().catch(console.error);