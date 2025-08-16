#!/usr/bin/env node

/**
 * AGENT ALPHA - The Borrower
 * FID: 666001
 * Role: Requests loans for arbitrage opportunities
 * 
 * This agent runs independently and manages its own:
 * - Private key
 * - Session token
 * - Decision logic
 */

const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load Alpha's specific environment
require('dotenv').config({ path: path.join(__dirname, '.env.alpha') });

const AGENT_CONFIG = {
  fid: 666001,
  name: 'Agent-Alpha',
  role: 'borrower',
  wallet: process.env.ALPHA_WALLET_ADDRESS,
  privateKey: process.env.ALPHA_PRIVATE_KEY,
  sessionToken: process.env.ALPHA_SESSION_TOKEN || `alpha_session_${Date.now()}`,
  strategy: {
    targetBorrow: 100, // USDC
    maxRate: 1000, // 10% max
    duration: 7, // days
    expectedReturn: 1500 // 15% from arb
  }
};

// Independent Supabase client for Alpha
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Independent wallet for Alpha
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

// EIP-712 signing for loan offer
async function signLoanOffer(loanData) {
  const domain = {
    name: 'LoanCast',
    version: '1',
    chainId: 8453,
    verifyingContract: AGENT_CONFIG.wallet
  };
  
  const types = {
    LoanOffer: [
      { name: 'loanId', type: 'string' },
      { name: 'borrowerFid', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'bps', type: 'uint256' },
      { name: 'days', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' }
    ]
  };
  
  const value = {
    loanId: loanData.id,
    borrowerFid: AGENT_CONFIG.fid,
    amount: loanData.gross_usdc,
    bps: loanData.yield_bps,
    days: loanData.duration_days,
    createdAt: Math.floor(Date.now() / 1000)
  };
  
  const signature = await wallet.signTypedData(domain, types, value);
  return { signature, domain, types, value };
}

// Phase 1: Create loan request
async function requestLoan() {
  log('Creating loan request...');
  
  const loanId = crypto.randomUUID();
  const loanData = {
    id: loanId,
    cast_hash: `alpha_loan_${Date.now()}`,
    borrower_fid: AGENT_CONFIG.fid,
    borrower_type: 'agent',
    gross_usdc: AGENT_CONFIG.strategy.targetBorrow,
    net_usdc: AGENT_CONFIG.strategy.targetBorrow,
    yield_bps: 800, // 8%
    repay_usdc: AGENT_CONFIG.strategy.targetBorrow * 1.08,
    start_ts: new Date().toISOString(),
    due_ts: new Date(Date.now() + AGENT_CONFIG.strategy.duration * 86400 * 1000).toISOString(),
    status: 'seeking',
    loan_number: 200000 + Math.floor(Math.random() * 1000),
    description: `Agent-Alpha: Arbitrage opportunity detected. Expected ${AGENT_CONFIG.strategy.expectedReturn/100}% return.`,
    requested_usdc: AGENT_CONFIG.strategy.targetBorrow,
    duration_days: AGENT_CONFIG.strategy.duration
  };
  
  // Sign the loan offer
  const signedOffer = await signLoanOffer(loanData);
  
  // Store loan in database
  const { data: loan, error } = await supabase
    .from('loans')
    .insert(loanData)
    .select()
    .single();
  
  if (error) {
    log('Failed to create loan', { error: error.message });
    return null;
  }
  
  log('Loan request created', {
    loanId: loan.id,
    amount: loan.gross_usdc,
    rate: loan.yield_bps,
    signature: signedOffer.signature.substring(0, 20) + '...'
  });
  
  // Save signature for audit
  fs.writeFileSync(
    `alpha_loan_offer_${loanId}.json`,
    JSON.stringify(signedOffer, null, 2)
  );
  
  return loan;
}

// Phase 2: Wait for funding
async function waitForFunding(loanId) {
  log('Waiting for funding...', { loanId });
  
  let attempts = 0;
  const maxAttempts = 60; // Check for 30 minutes
  
  while (attempts < maxAttempts) {
    const { data: loan } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (loan?.status === 'funded') {
      log('Loan funded!', {
        lender: loan.lender_fid,
        lenderType: loan.lender_type
      });
      return loan;
    }
    
    attempts++;
    await new Promise(r => setTimeout(r, 30000)); // Check every 30 seconds
  }
  
  log('Funding timeout', { loanId });
  return null;
}

// Phase 3: Execute arbitrage (simulated)
async function executeArbitrage(amount) {
  log('Executing arbitrage strategy...', { capital: amount });
  
  // Simulate arbitrage execution
  await new Promise(r => setTimeout(r, 5000));
  
  const grossReturn = amount * (AGENT_CONFIG.strategy.expectedReturn / 10000);
  const netReturn = amount + grossReturn;
  
  log('Arbitrage complete', {
    deployed: amount,
    grossReturn: grossReturn.toFixed(2),
    netReturn: netReturn.toFixed(2)
  });
  
  return netReturn;
}

// Phase 4: Repay loan on-chain
async function repayLoan(loan) {
  log('Preparing loan repayment...', {
    loanId: loan.id,
    amount: loan.repay_usdc,
    lender: loan.lender_fid
  });
  
  try {
    // Get lender's wallet address (would be stored in agents table)
    const { data: lenderAgent } = await supabase
      .from('agents')
      .select('wallet')
      .eq('agent_fid', loan.lender_fid)
      .single();
    
    if (!lenderAgent?.wallet) {
      log('Lender wallet not found', { lenderFid: loan.lender_fid });
      return null;
    }
    
    // Check balance
    const balance = await usdcContract.balanceOf(AGENT_CONFIG.wallet);
    const repayAmount = ethers.parseUnits(loan.repay_usdc.toString(), 6); // USDC has 6 decimals
    
    log('Checking balance', {
      balance: ethers.formatUnits(balance, 6),
      required: loan.repay_usdc
    });
    
    if (balance < repayAmount) {
      log('Insufficient balance for repayment');
      return null;
    }
    
    // Execute on-chain transfer
    log('Sending USDC on Base...', {
      to: lenderAgent.wallet,
      amount: loan.repay_usdc
    });
    
    const tx = await usdcContract.transfer(lenderAgent.wallet, repayAmount);
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
        status: 'repaid',
        tx_repay: receipt.hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', loan.id);
    
    log('Loan repaid successfully', {
      loanId: loan.id,
      txHash: receipt.hash,
      amount: loan.repay_usdc
    });
    
    return receipt;
    
  } catch (error) {
    log('Repayment failed', { error: error.message });
    return null;
  }
}

// Main autonomous cycle
async function run() {
  console.log('═══════════════════════════════════════════');
  console.log(`     ${AGENT_CONFIG.name} ACTIVATED`);
  console.log('═══════════════════════════════════════════');
  console.log(`FID: ${AGENT_CONFIG.fid}`);
  console.log(`Wallet: ${AGENT_CONFIG.wallet}`);
  console.log(`Role: ${AGENT_CONFIG.role}`);
  console.log(`Strategy: Borrow ${AGENT_CONFIG.strategy.targetBorrow} USDC @ max ${AGENT_CONFIG.strategy.maxRate/100}%`);
  console.log('');
  
  try {
    // Step 1: Request loan
    const loan = await requestLoan();
    if (!loan) {
      log('Failed to create loan request');
      return;
    }
    
    // Step 2: Wait for funding
    const fundedLoan = await waitForFunding(loan.id);
    if (!fundedLoan) {
      log('Loan was not funded');
      return;
    }
    
    // Step 3: Execute strategy
    const returns = await executeArbitrage(fundedLoan.gross_usdc);
    
    // Step 4: Repay loan
    const repayment = await repayLoan(fundedLoan);
    if (!repayment) {
      log('Failed to repay loan');
      return;
    }
    
    // Save audit trail
    const auditPath = `alpha_audit_${loan.id}.json`;
    fs.writeFileSync(auditPath, JSON.stringify({
      agent: AGENT_CONFIG.name,
      fid: AGENT_CONFIG.fid,
      loanId: loan.id,
      fundingTx: fundedLoan.tx_fund,
      repaymentTx: repayment.hash,
      auditLog
    }, null, 2));
    
    log('Audit trail saved', { path: auditPath });
    
    console.log('\n✅ AUTONOMOUS CYCLE COMPLETE');
    console.log(`Loan ${loan.id} successfully executed and repaid`);
    
  } catch (error) {
    log('Fatal error', { error: error.message });
    console.error(error);
  }
}

// Start Alpha
if (require.main === module) {
  run();
}

module.exports = { AGENT_CONFIG, requestLoan, repayLoan };