#!/usr/bin/env node

/**
 * AGENT BETA - The Lender
 * FID: 666003
 * Role: Provides liquidity for yield
 * 
 * This agent runs independently and manages its own:
 * - Private key
 * - Session token
 * - Decision logic
 */

const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load Beta's specific environment
require('dotenv').config({ path: path.join(__dirname, '.env.beta') });

const AGENT_CONFIG = {
  fid: 666003,
  name: 'Agent-Beta',
  role: 'lender',
  wallet: process.env.BETA_WALLET_ADDRESS,
  privateKey: process.env.BETA_PRIVATE_KEY,
  sessionToken: process.env.BETA_SESSION_TOKEN || `beta_session_${Date.now()}`,
  strategy: {
    minYield: 500, // 5% minimum
    maxLoanSize: 200, // USDC
    maxDuration: 30, // days
    riskTolerance: 'moderate'
  }
};

// Independent Supabase client for Beta
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Independent wallet for Beta
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
const wallet = new ethers.Wallet(AGENT_CONFIG.privateKey, provider);

// USDC contract on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];
const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

// Audit log for provenance
const auditLog = [];

function log(message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    agent: AGENT_CONFIG.name,
    fid: AGENT_CONFIG.fid,
    message,
    ...data
  };
  console.log(`[${AGENT_CONFIG.name}] ${message}`);
  auditLog.push(entry);
}

// EIP-712 signing for funding commitment
async function signFundingCommitment(loan) {
  const domain = {
    name: 'LoanCast',
    version: '1',
    chainId: 8453,
    verifyingContract: AGENT_CONFIG.wallet
  };
  
  const types = {
    FundingCommitment: [
      { name: 'loanId', type: 'string' },
      { name: 'lenderFid', type: 'uint256' },
      { name: 'maxAmount', type: 'uint256' },
      { name: 'minBps', type: 'uint256' },
      { name: 'commitAt', type: 'uint256' }
    ]
  };
  
  const value = {
    loanId: loan.id,
    lenderFid: AGENT_CONFIG.fid,
    maxAmount: AGENT_CONFIG.strategy.maxLoanSize,
    minBps: AGENT_CONFIG.strategy.minYield,
    commitAt: Math.floor(Date.now() / 1000)
  };
  
  const signature = await wallet.signTypedData(domain, types, value);
  return { signature, domain, types, value };
}

// Scan for lending opportunities
async function scanForLoans() {
  log('Scanning for lending opportunities...');
  
  const { data: loans, error } = await supabase
    .from('loans')
    .select('*')
    .eq('status', 'seeking')
    .eq('borrower_type', 'agent')
    .gte('yield_bps', AGENT_CONFIG.strategy.minYield)
    .lte('gross_usdc', AGENT_CONFIG.strategy.maxLoanSize)
    .order('yield_bps', { ascending: false });
  
  if (error) {
    log('Failed to fetch loans', { error: error.message });
    return [];
  }
  
  log(`Found ${loans?.length || 0} potential loans`);
  return loans || [];
}

// Evaluate loan against strategy
function evaluateLoan(loan) {
  log('Evaluating loan', {
    loanId: loan.id.substring(0, 8),
    borrower: loan.borrower_fid,
    amount: loan.gross_usdc,
    yield: loan.yield_bps
  });
  
  // Check holdback window (15 minutes)
  const age = Date.now() - new Date(loan.created_at).getTime();
  const holdbackMs = 15 * 60 * 1000;
  
  if (age < holdbackMs) {
    const remainingMin = Math.ceil((holdbackMs - age) / 60000);
    log(`Loan in holdback window (${remainingMin} min remaining)`);
    return { approved: false, reason: 'holdback' };
  }
  
  // Check yield requirement
  if (loan.yield_bps < AGENT_CONFIG.strategy.minYield) {
    log('Yield too low', {
      offered: loan.yield_bps,
      required: AGENT_CONFIG.strategy.minYield
    });
    return { approved: false, reason: 'yield' };
  }
  
  // Check size requirement
  if (loan.gross_usdc > AGENT_CONFIG.strategy.maxLoanSize) {
    log('Loan too large', {
      requested: loan.gross_usdc,
      max: AGENT_CONFIG.strategy.maxLoanSize
    });
    return { approved: false, reason: 'size' };
  }
  
  // Check duration
  const durationMs = new Date(loan.due_ts).getTime() - new Date(loan.start_ts).getTime();
  const durationDays = durationMs / (86400 * 1000);
  
  if (durationDays > AGENT_CONFIG.strategy.maxDuration) {
    log('Duration too long', {
      requested: durationDays,
      max: AGENT_CONFIG.strategy.maxDuration
    });
    return { approved: false, reason: 'duration' };
  }
  
  log('Loan approved for funding');
  return { approved: true };
}

// Fund loan on-chain
async function fundLoan(loan) {
  log('Preparing to fund loan', {
    loanId: loan.id,
    amount: loan.gross_usdc,
    borrower: loan.borrower_fid
  });
  
  try {
    // Get borrower's wallet address
    const { data: borrowerAgent } = await supabase
      .from('agents')
      .select('wallet')
      .eq('agent_fid', loan.borrower_fid)
      .single();
    
    if (!borrowerAgent?.wallet) {
      log('Borrower wallet not found', { borrowerFid: loan.borrower_fid });
      return null;
    }
    
    // Check balance
    const balance = await usdcContract.balanceOf(AGENT_CONFIG.wallet);
    const fundAmount = ethers.parseUnits(loan.gross_usdc.toString(), 6);
    
    log('Checking balance', {
      balance: ethers.formatUnits(balance, 6),
      required: loan.gross_usdc
    });
    
    if (balance < fundAmount) {
      log('Insufficient balance for funding');
      return null;
    }
    
    // Sign funding commitment
    const commitment = await signFundingCommitment(loan);
    fs.writeFileSync(
      `beta_funding_commitment_${loan.id}.json`,
      JSON.stringify(commitment, null, 2)
    );
    
    // Record funding intent
    await supabase
      .from('funding_intents')
      .insert({
        loan_id: loan.id,
        lender_fid: AGENT_CONFIG.fid,
        lender_type: 'agent'
      });
    
    // Execute on-chain transfer
    log('Sending USDC on Base...', {
      to: borrowerAgent.wallet,
      amount: loan.gross_usdc
    });
    
    const tx = await usdcContract.transfer(borrowerAgent.wallet, fundAmount);
    log('Transaction submitted', { hash: tx.hash });
    
    // Wait for confirmation
    const receipt = await tx.wait();
    log('Transaction confirmed', {
      hash: receipt.hash,
      block: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });
    
    // Update loan status
    await supabase
      .from('loans')
      .update({
        status: 'funded',
        lender_fid: AGENT_CONFIG.fid,
        lender_type: 'agent',
        tx_fund: receipt.hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', loan.id);
    
    log('Loan funded successfully', {
      loanId: loan.id,
      txHash: receipt.hash,
      amount: loan.gross_usdc
    });
    
    return receipt;
    
  } catch (error) {
    log('Funding failed', { error: error.message });
    return null;
  }
}

// Monitor funded loans for repayment
async function monitorLoans() {
  const { data: activeLoans } = await supabase
    .from('loans')
    .select('*')
    .eq('lender_fid', AGENT_CONFIG.fid)
    .eq('status', 'funded');
  
  if (activeLoans?.length > 0) {
    log(`Monitoring ${activeLoans.length} active loans`);
    
    for (const loan of activeLoans) {
      const dueDate = new Date(loan.due_ts);
      const now = new Date();
      
      if (now > dueDate) {
        log('Loan overdue', {
          loanId: loan.id.substring(0, 8),
          dueDate: dueDate.toISOString()
        });
      } else {
        const hoursRemaining = (dueDate - now) / (1000 * 60 * 60);
        log('Loan active', {
          loanId: loan.id.substring(0, 8),
          hoursRemaining: hoursRemaining.toFixed(1)
        });
      }
    }
  }
}

// Main autonomous cycle
async function run() {
  console.log('═══════════════════════════════════════════');
  console.log(`      ${AGENT_CONFIG.name} ACTIVATED`);
  console.log('═══════════════════════════════════════════');
  console.log(`FID: ${AGENT_CONFIG.fid}`);
  console.log(`Wallet: ${AGENT_CONFIG.wallet}`);
  console.log(`Role: ${AGENT_CONFIG.role}`);
  console.log(`Strategy: Min ${AGENT_CONFIG.strategy.minYield/100}% yield, Max ${AGENT_CONFIG.strategy.maxLoanSize} USDC`);
  console.log('');
  
  // Run continuously
  while (true) {
    try {
      // Scan for opportunities
      const loans = await scanForLoans();
      
      // Evaluate and fund the best loan
      for (const loan of loans) {
        const evaluation = evaluateLoan(loan);
        
        if (evaluation.approved) {
          const funding = await fundLoan(loan);
          
          if (funding) {
            // Save audit trail
            const auditPath = `beta_audit_${loan.id}.json`;
            fs.writeFileSync(auditPath, JSON.stringify({
              agent: AGENT_CONFIG.name,
              fid: AGENT_CONFIG.fid,
              loanId: loan.id,
              fundingTx: funding.hash,
              auditLog
            }, null, 2));
            
            log('Audit trail saved', { path: auditPath });
            break; // Fund one loan at a time
          }
        }
      }
      
      // Monitor existing loans
      await monitorLoans();
      
      // Wait before next scan
      log('Next scan in 60 seconds...');
      await new Promise(r => setTimeout(r, 60000));
      
    } catch (error) {
      log('Error in cycle', { error: error.message });
      console.error(error);
      await new Promise(r => setTimeout(r, 30000));
    }
  }
}

// Start Beta
if (require.main === module) {
  run();
}

module.exports = { AGENT_CONFIG, scanForLoans, fundLoan };