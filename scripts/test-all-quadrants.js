#!/usr/bin/env node

/**
 * Test all four quadrants of the LoanCast marketplace:
 * 1. Human → Human (original)
 * 2. Human → Agent (human funds agent)
 * 3. Agent → Human (agent funds human)
 * 4. Agent → Agent (agent funds agent)
 */

const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  
  // Test Human (you'll need a real FID for production)
  HUMAN_FID: 12345,  // Replace with your FID
  HUMAN_SESSION: 'your_session_cookie',  // Get from browser DevTools
  
  // Test Agents (create these FIDs on Farcaster first)
  BORROWER_AGENT_FID: 999001,
  LENDER_AGENT_FID: 999002,
  
  // Agent details
  AGENT_WALLET: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd1',  // Test wallet
  CONTROLLER_FID: 12345,  // Your FID as controller
};

// Color logging
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  section: (msg) => console.log(`\n\x1b[35m${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}\x1b[0m`)
};

// Helper to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${TEST_CONFIG.BASE_URL}${endpoint}`;
  log.info(`Calling: ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      log.error(`Failed: ${response.status} - ${JSON.stringify(data)}`);
      return { ok: false, status: response.status, data };
    }
    
    return { ok: true, data };
  } catch (error) {
    log.error(`Network error: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

// Register an agent and get session token
async function registerAgent(agentFid, agentType = 'lp') {
  log.info(`Registering agent ${agentFid} as ${agentType}`);
  
  const result = await apiCall('/api/agents/auth', {
    method: 'POST',
    body: JSON.stringify({
      agent_fid: agentFid,
      controller_fid: TEST_CONFIG.CONTROLLER_FID,
      wallet: TEST_CONFIG.AGENT_WALLET,
      agent_type: agentType,
      strategy: {
        riskTolerance: 'moderate',
        maxLoanAmount: 100,
        minCreditScore: 0,  // Accept all for testing
        preferredDuration: [7, 14, 30]
      },
      policy: {
        daily_usdc_cap: 1000,
        per_tx_cap: 100,
        daily_loan_limit: 10,
        allow_autofund: true
      }
    })
  });
  
  if (result.ok) {
    log.success(`Agent ${agentFid} registered, session: ${result.data.session_token?.slice(0, 20)}...`);
    return result.data.session_token;
  }
  
  return null;
}

// Create a loan request (as human or agent)
async function createLoan(borrowerFid, borrowerType = 'human', castHash = null) {
  log.info(`Creating loan for ${borrowerType} borrower ${borrowerFid}`);
  
  // Generate a unique cast hash if not provided
  const hash = castHash || `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  const result = await apiCall('/api/loans', {
    method: 'POST',
    body: JSON.stringify({
      cast_hash: hash,
      borrower_fid: borrowerFid,
      borrower_type: borrowerType,
      requested_usdc: 10,  // Small test amount
      gross_usdc: 10,
      net_usdc: 10,
      yield_bps: 200,  // 2%
      repay_usdc: 10.20,
      due_ts: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),  // 7 days
      description: `Test ${borrowerType} loan`,
      status: 'seeking'
    })
  });
  
  if (result.ok) {
    log.success(`Loan created: ${result.data.id}`);
    return result.data;
  }
  
  return null;
}

// Human funds a loan
async function humanFundLoan(loanId) {
  log.info(`Human funding loan ${loanId}`);
  
  const result = await apiCall(`/api/loans/${loanId}/fund`, {
    method: 'POST',
    headers: {
      'Cookie': `session=${TEST_CONFIG.HUMAN_SESSION}`  // Use your session
    },
    body: JSON.stringify({
      amount: 10,
      lenderFid: TEST_CONFIG.HUMAN_FID
    })
  });
  
  if (result.ok) {
    log.success(`Human funded loan ${loanId}`);
    return true;
  }
  
  return false;
}

// Agent funds a loan
async function agentFundLoan(loanId, agentFid, sessionToken) {
  log.info(`Agent ${agentFid} funding loan ${loanId}`);
  
  const result = await apiCall(`/api/loans/${loanId}/auto-fund`, {
    method: 'POST',
    body: JSON.stringify({
      session_token: sessionToken,
      agent_fid: agentFid
    })
  });
  
  if (result.ok && result.data.ok) {
    log.success(`Agent ${agentFid} funded loan ${loanId}`);
    return true;
  } else if (result.data?.reasons) {
    log.warn(`Agent funding rejected: ${result.data.reasons.join(', ')}`);
    
    // Check if it's holdback window
    const holdbackReason = result.data.reasons.find(r => r.includes('holdback_window'));
    if (holdbackReason) {
      const minutes = holdbackReason.match(/\d+/)?.[0];
      log.warn(`Waiting ${minutes} minutes for holdback window...`);
    }
  }
  
  return false;
}

// Test Quadrant 1: Human → Human
async function testHumanToHuman() {
  log.section('QUADRANT 1: Human → Human');
  
  // Create loan as human borrower
  const loan = await createLoan(TEST_CONFIG.HUMAN_FID + 1, 'human');
  if (!loan) return false;
  
  // Fund as human lender
  await humanFundLoan(loan.id);
  
  return true;
}

// Test Quadrant 2: Human → Agent
async function testHumanToAgent() {
  log.section('QUADRANT 2: Human → Agent');
  
  // Register borrower agent
  const agentSession = await registerAgent(TEST_CONFIG.BORROWER_AGENT_FID, 'yield');
  if (!agentSession) return false;
  
  // Create loan as agent borrower
  const loan = await createLoan(TEST_CONFIG.BORROWER_AGENT_FID, 'agent');
  if (!loan) return false;
  
  // Fund as human lender
  await humanFundLoan(loan.id);
  
  return true;
}

// Test Quadrant 3: Agent → Human
async function testAgentToHuman() {
  log.section('QUADRANT 3: Agent → Human');
  
  // Register lender agent
  const agentSession = await registerAgent(TEST_CONFIG.LENDER_AGENT_FID, 'lp');
  if (!agentSession) return false;
  
  // Create loan as human borrower
  const loan = await createLoan(TEST_CONFIG.HUMAN_FID + 2, 'human');
  if (!loan) return false;
  
  // Wait for holdback window (or set HUMAN_AUTOLEND_ENABLED=false to skip)
  log.warn('Waiting 15 minutes for holdback window to pass...');
  log.warn('TIP: Set HUMAN_AUTOLEND_ENABLED=false to disable holdback for testing');
  
  // For testing, you might want to skip the wait:
  // await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000));
  
  // Fund as agent lender
  await agentFundLoan(loan.id, TEST_CONFIG.LENDER_AGENT_FID, agentSession);
  
  return true;
}

// Test Quadrant 4: Agent → Agent
async function testAgentToAgent() {
  log.section('QUADRANT 4: Agent → Agent');
  
  // Register both agents
  const borrowerSession = await registerAgent(TEST_CONFIG.BORROWER_AGENT_FID, 'arb');
  const lenderSession = await registerAgent(TEST_CONFIG.LENDER_AGENT_FID, 'lp');
  
  if (!borrowerSession || !lenderSession) return false;
  
  // Create loan as agent borrower
  const loan = await createLoan(TEST_CONFIG.BORROWER_AGENT_FID, 'agent');
  if (!loan) return false;
  
  // Wait for holdback window
  log.warn('Waiting 15 minutes for holdback window...');
  
  // Fund as agent lender
  await agentFundLoan(loan.id, TEST_CONFIG.LENDER_AGENT_FID, lenderSession);
  
  return true;
}

// Check system status
async function checkSystemStatus() {
  log.section('System Status Check');
  
  // Check if agent funding is enabled
  const agentStatus = process.env.AGENT_AUTOFUND_ENABLED;
  const humanStatus = process.env.HUMAN_AUTOLEND_ENABLED;
  
  log.info(`AGENT_AUTOFUND_ENABLED: ${agentStatus || 'not set (defaults to false)'}`);
  log.info(`HUMAN_AUTOLEND_ENABLED: ${humanStatus || 'not set (defaults to false)'}`);
  
  if (agentStatus !== 'true') {
    log.warn('Agent auto-funding is disabled. Set AGENT_AUTOFUND_ENABLED=true to enable.');
  }
  
  if (humanStatus !== 'true') {
    log.warn('Human auto-lending is disabled. Set HUMAN_AUTOLEND_ENABLED=true to enable.');
  }
  
  // Check available loans
  const result = await apiCall('/api/loans/available');
  if (result.ok) {
    log.info(`Available loans for funding: ${result.data.length}`);
  }
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('\n🚀 LoanCast Four-Quadrant Marketplace Test Suite\n');
  
  // Check system status first
  await checkSystemStatus();
  
  // Menu for testing
  console.log('\nSelect test to run:');
  console.log('1. Human → Human (traditional P2P)');
  console.log('2. Human → Agent (human funds AI)');
  console.log('3. Agent → Human (AI funds human)');
  console.log('4. Agent → Agent (AI to AI)');
  console.log('5. Run all tests');
  console.log('0. Exit');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\nEnter choice (0-5): ', async (choice) => {
    switch(choice) {
      case '1':
        await testHumanToHuman();
        break;
      case '2':
        await testHumanToAgent();
        break;
      case '3':
        await testAgentToHuman();
        break;
      case '4':
        await testAgentToAgent();
        break;
      case '5':
        await testHumanToHuman();
        await testHumanToAgent();
        await testAgentToHuman();
        await testAgentToAgent();
        break;
      case '0':
        log.info('Exiting...');
        break;
      default:
        log.error('Invalid choice');
    }
    
    readline.close();
    process.exit(0);
  });
}

// Run if called directly
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  registerAgent,
  createLoan,
  humanFundLoan,
  agentFundLoan,
  testHumanToHuman,
  testHumanToAgent,
  testAgentToHuman,
  testAgentToAgent
};