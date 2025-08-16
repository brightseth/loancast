#!/usr/bin/env node

/**
 * Local testing script for all four quadrants
 * This creates test data directly in the database for easier testing
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test configuration
const TEST_DATA = {
  HUMAN_BORROWER_FID: 100001,
  HUMAN_LENDER_FID: 100002,
  AGENT_BORROWER_FID: 200001,
  AGENT_LENDER_FID: 200002,
  CONTROLLER_FID: 100000,  // The human controlling the agents
};

// Color logging
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[✓]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[✗]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[!]\x1b[0m ${msg}`),
  section: (msg) => console.log(`\n\x1b[35m${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}\x1b[0m\n`)
};

// Helper to create test loans directly in database
async function createTestLoan(borrowerFid, borrowerType, lenderFid = null, lenderType = null) {
  const loanData = {
    cast_hash: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    borrower_fid: borrowerFid,
    borrower_type: borrowerType,
    lender_fid: lenderFid,
    lender_type: lenderType,
    principal_usdc_6: 10000000,  // $10 with 6 decimals
    gross_usdc: 10,
    net_usdc: 10,
    yield_bps: 200,  // 2%
    repay_usdc: 10.20,
    due_ts: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: lenderFid ? 'funded' : 'seeking',
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()  // 20 mins ago (past holdback)
  };

  const { data, error } = await supabaseAdmin
    .from('loans')
    .insert(loanData)
    .select()
    .single();

  if (error) {
    log.error(`Failed to create loan: ${error.message}`);
    return null;
  }

  return data;
}

// Setup test agents in database
async function setupTestAgents() {
  log.section('Setting up test agents');

  // Create borrower agent
  const borrowerAgent = {
    agent_fid: TEST_DATA.AGENT_BORROWER_FID,
    controller_fid: TEST_DATA.CONTROLLER_FID,
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd1',
    agent_type: 'yield',
    strategy: {
      riskTolerance: 'moderate',
      maxLoanAmount: 100,
      minCreditScore: 0,
      preferredDuration: [7, 14, 30]
    },
    policy: {
      daily_usdc_cap: 1000,
      per_tx_cap: 100,
      allow_autofund: false  // Borrower doesn't lend
    },
    active: true
  };

  // Create lender agent
  const lenderAgent = {
    agent_fid: TEST_DATA.AGENT_LENDER_FID,
    controller_fid: TEST_DATA.CONTROLLER_FID,
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd2',
    agent_type: 'lp',
    strategy: {
      riskTolerance: 'aggressive',
      maxLoanAmount: 200,
      minCreditScore: 0,
      preferredDuration: [7, 14, 30]
    },
    policy: {
      daily_usdc_cap: 2000,
      per_tx_cap: 200,
      allow_autofund: true  // Can auto-fund
    },
    active: true
  };

  // Delete existing test agents first
  await supabaseAdmin
    .from('agents')
    .delete()
    .in('agent_fid', [TEST_DATA.AGENT_BORROWER_FID, TEST_DATA.AGENT_LENDER_FID]);

  // Insert agents
  const { data: data1, error: error1 } = await supabaseAdmin
    .from('agents')
    .insert(borrowerAgent)
    .select();

  const { data: data2, error: error2 } = await supabaseAdmin
    .from('agents')
    .insert(lenderAgent)
    .select();

  if (error1 || error2) {
    log.error('Failed to create agents');
    if (error1) log.error(`Agent 1 error: ${JSON.stringify(error1)}`);
    if (error2) log.error(`Agent 2 error: ${JSON.stringify(error2)}`);
    return false;
  }
  
  log.info(`Created agent 1: ${data1 ? 'success' : 'no data'}`);
  log.info(`Created agent 2: ${data2 ? 'success' : 'no data'}`)

  log.success('Test agents created');
  return true;
}

// Setup test humans with autolend preferences
async function setupTestHumans() {
  log.section('Setting up test humans');

  // Create human lender with autolend preferences
  const humanLenderPrefs = {
    lender_fid: TEST_DATA.HUMAN_LENDER_FID,
    active: true,
    min_score: 0,
    max_amount_usdc: 100,
    max_duration_days: 30,
    daily_limit_usdc: 500,
    per_borrower_limit_usdc: 100,
    allow_human: true,
    allow_agent: true
  };

  // Delete existing test preferences first
  await supabaseAdmin
    .from('human_autolend_prefs')
    .delete()
    .eq('lender_fid', TEST_DATA.HUMAN_LENDER_FID);

  const { error } = await supabaseAdmin
    .from('human_autolend_prefs')
    .insert(humanLenderPrefs);

  if (error) {
    log.error('Failed to create human preferences');
    log.error(`Error: ${error.message}`);
    return false;
  }

  log.success('Test humans configured');
  return true;
}

// Test each quadrant
async function testQuadrant1_HumanToHuman() {
  log.section('QUADRANT 1: Human → Human');
  
  const loan = await createTestLoan(
    TEST_DATA.HUMAN_BORROWER_FID, 
    'human',
    TEST_DATA.HUMAN_LENDER_FID,
    'human'
  );
  
  if (loan) {
    log.success(`Created Human→Human loan: ${loan.id}`);
    log.info(`Borrower: Human FID ${loan.borrower_fid}`);
    log.info(`Lender: Human FID ${loan.lender_fid}`);
    log.info(`Status: ${loan.status}`);
    return true;
  }
  return false;
}

async function testQuadrant2_HumanToAgent() {
  log.section('QUADRANT 2: Human → Agent');
  
  const loan = await createTestLoan(
    TEST_DATA.AGENT_BORROWER_FID,
    'agent',
    TEST_DATA.HUMAN_LENDER_FID,
    'human'
  );
  
  if (loan) {
    log.success(`Created Human→Agent loan: ${loan.id}`);
    log.info(`Borrower: Agent FID ${loan.borrower_fid} (${loan.borrower_type})`);
    log.info(`Lender: Human FID ${loan.lender_fid} (${loan.lender_type})`);
    log.info(`Status: ${loan.status}`);
    return true;
  }
  return false;
}

async function testQuadrant3_AgentToHuman() {
  log.section('QUADRANT 3: Agent → Human');
  
  const loan = await createTestLoan(
    TEST_DATA.HUMAN_BORROWER_FID,
    'human',
    TEST_DATA.AGENT_LENDER_FID,
    'agent'
  );
  
  if (loan) {
    log.success(`Created Agent→Human loan: ${loan.id}`);
    log.info(`Borrower: Human FID ${loan.borrower_fid} (${loan.borrower_type})`);
    log.info(`Lender: Agent FID ${loan.lender_fid} (${loan.lender_type})`);
    log.info(`Status: ${loan.status}`);
    return true;
  }
  return false;
}

async function testQuadrant4_AgentToAgent() {
  log.section('QUADRANT 4: Agent → Agent');
  
  const loan = await createTestLoan(
    TEST_DATA.AGENT_BORROWER_FID,
    'agent',
    TEST_DATA.AGENT_LENDER_FID,
    'agent'
  );
  
  if (loan) {
    log.success(`Created Agent→Agent loan: ${loan.id}`);
    log.info(`Borrower: Agent FID ${loan.borrower_fid} (${loan.borrower_type})`);
    log.info(`Lender: Agent FID ${loan.lender_fid} (${loan.lender_type})`);
    log.info(`Status: ${loan.status}`);
    return true;
  }
  return false;
}

// Check current system state
async function checkSystemState() {
  log.section('System State Check');
  
  // Check environment variables
  log.info(`AGENT_AUTOFUND_ENABLED: ${process.env.AGENT_AUTOFUND_ENABLED || 'not set'}`);
  log.info(`HUMAN_AUTOLEND_ENABLED: ${process.env.HUMAN_AUTOLEND_ENABLED || 'not set'}`);
  
  // Count loans by type
  const { data: loans } = await supabaseAdmin
    .from('loans')
    .select('borrower_type, lender_type, status')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (loans) {
    const stats = {
      'human→human': 0,
      'human→agent': 0,
      'agent→human': 0,
      'agent→agent': 0,
      'seeking': 0,
      'funded': 0
    };
    
    loans.forEach(loan => {
      if (loan.borrower_type && loan.lender_type) {
        const key = `${loan.borrower_type}→${loan.lender_type}`;
        stats[key] = (stats[key] || 0) + 1;
      }
      stats[loan.status] = (stats[loan.status] || 0) + 1;
    });
    
    log.info('Recent loan distribution:');
    Object.entries(stats).forEach(([key, count]) => {
      if (count > 0) log.info(`  ${key}: ${count}`);
    });
  }
  
  // Check active agents
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('agent_fid, agent_type, active')
    .eq('active', true);
  
  if (agents) {
    log.info(`Active agents: ${agents.length}`);
    agents.forEach(agent => {
      log.info(`  Agent ${agent.agent_fid} (${agent.agent_type})`);
    });
  }
}

// Clean up test data
async function cleanupTestData() {
  log.section('Cleaning up test data');
  
  const testFids = [
    TEST_DATA.HUMAN_BORROWER_FID,
    TEST_DATA.HUMAN_LENDER_FID,
    TEST_DATA.AGENT_BORROWER_FID,
    TEST_DATA.AGENT_LENDER_FID
  ];
  
  // Delete test loans
  const { error: loanError } = await supabaseAdmin
    .from('loans')
    .delete()
    .or(`borrower_fid.in.(${testFids.join(',')}),lender_fid.in.(${testFids.join(',')})`);
  
  // Delete test agents
  const { error: agentError } = await supabaseAdmin
    .from('agents')
    .delete()
    .in('agent_fid', [TEST_DATA.AGENT_BORROWER_FID, TEST_DATA.AGENT_LENDER_FID]);
  
  // Delete test preferences
  const { error: prefError } = await supabaseAdmin
    .from('human_autolend_prefs')
    .delete()
    .eq('lender_fid', TEST_DATA.HUMAN_LENDER_FID);
  
  if (loanError || agentError || prefError) {
    log.warn('Some cleanup operations failed');
  } else {
    log.success('Test data cleaned up');
  }
}

// Main test runner
async function runTests() {
  console.log('\n🚀 LoanCast Four-Quadrant Test Suite (Local)\n');
  
  try {
    // Check current state
    await checkSystemState();
    
    // Setup test data
    const agentsReady = await setupTestAgents();
    const humansReady = await setupTestHumans();
    
    if (!agentsReady || !humansReady) {
      log.error('Failed to setup test data');
      return;
    }
    
    // Run all quadrant tests
    const results = {
      q1: await testQuadrant1_HumanToHuman(),
      q2: await testQuadrant2_HumanToAgent(),
      q3: await testQuadrant3_AgentToHuman(),
      q4: await testQuadrant4_AgentToAgent()
    };
    
    // Summary
    log.section('Test Results Summary');
    log.info(`Human → Human: ${results.q1 ? '✓' : '✗'}`);
    log.info(`Human → Agent: ${results.q2 ? '✓' : '✗'}`);
    log.info(`Agent → Human: ${results.q3 ? '✓' : '✗'}`);
    log.info(`Agent → Agent: ${results.q4 ? '✓' : '✗'}`);
    
    // Ask about cleanup
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\nClean up test data? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await cleanupTestData();
      }
      readline.close();
      process.exit(0);
    });
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}