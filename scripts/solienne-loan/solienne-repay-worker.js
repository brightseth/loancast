#!/usr/bin/env node

/**
 * Solienne's Autonomous Repayment Worker
 * Runs independently to repay loans when due
 * This completes the Human→Agent loan cycle
 */

const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config({ path: '../../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Solienne's configuration
const SOLIENNE_CONFIG = {
  fid: 1113468,
  wallet: process.env.SOLIENNE_WALLET,
  privateKey: process.env.SOLIENNE_PRIVATE_KEY
};

// USDC on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

function log(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (Object.keys(data).length > 0) {
    console.log('  ', JSON.stringify(data));
  }
}

async function checkAndRepayLoans() {
  log('🤖 Solienne checking for loans to repay...');
  
  // Fetch Solienne's funded loans
  const { data: loans, error } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_type', 'agent')
    .eq('borrower_fid', SOLIENNE_CONFIG.fid)
    .eq('status', 'funded');
  
  if (error) {
    log('❌ Error fetching loans:', { error: error.message });
    return;
  }
  
  if (!loans || loans.length === 0) {
    log('No funded loans to repay');
    return;
  }
  
  log(`Found ${loans.length} funded loan(s)`);
  
  const provider = new ethers.JsonRpcProvider(
    process.env.BASE_RPC_URL || 'https://mainnet.base.org'
  );
  const wallet = new ethers.Wallet(SOLIENNE_CONFIG.privateKey, provider);
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
  
  for (const loan of loans) {
    await processLoanRepayment(loan, usdc, wallet);
  }
}

async function processLoanRepayment(loan, usdcContract, wallet) {
  log(`Processing loan ${loan.id.substring(0, 8)}...`);
  
  // Check if due
  const now = Date.now();
  const dueDate = new Date(loan.due_ts).getTime();
  
  if (now < dueDate) {
    const hoursRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60));
    log(`Not due yet (${hoursRemaining} hours remaining)`);
    return;
  }
  
  log('Loan is due for repayment', {
    lender: loan.lender_fid,
    lender_type: loan.lender_type,
    amount: loan.gross_usdc,
    repay_amount: loan.repay_usdc
  });
  
  // Get lender address
  const lenderAddress = loan.lender_address;
  if (!lenderAddress) {
    log('❌ Lender address not found on loan record');
    return;
  }
  
  // Calculate exact repayment
  const principal = ethers.parseUnits(loan.gross_usdc.toString(), 6);
  const repayAmount = ethers.parseUnits(loan.repay_usdc.toString(), 6);
  
  try {
    // Check balance
    const balance = await usdcContract.balanceOf(wallet.address);
    log('Checking balance', {
      required: ethers.formatUnits(repayAmount, 6),
      available: ethers.formatUnits(balance, 6)
    });
    
    if (balance < repayAmount) {
      log('❌ Insufficient USDC for repayment');
      return;
    }
    
    // Execute repayment
    log('💸 Sending repayment on Base...', {
      to: lenderAddress,
      amount: ethers.formatUnits(repayAmount, 6) + ' USDC'
    });
    
    const tx = await usdcContract.transfer(lenderAddress, repayAmount);
    log('Transaction submitted', { hash: tx.hash });
    
    const receipt = await tx.wait();
    log('✅ Transaction confirmed!', {
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
        repaid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', loan.id);
    
    // Update Solienne's stats
    const { data: stats } = await supabase
      .from('agent_stats')
      .select('loans_repaid, score')
      .eq('agent_fid', SOLIENNE_CONFIG.fid)
      .single();
    
    await supabase
      .from('agent_stats')
      .update({
        loans_repaid: (stats?.loans_repaid || 0) + 1,
        score: Math.min((stats?.score || 700) + 25, 850),
        last_active: new Date().toISOString()
      })
      .eq('agent_fid', SOLIENNE_CONFIG.fid);
    
    log('✅ LOAN REPAID SUCCESSFULLY!', {
      loan_id: loan.id,
      tx_hash: receipt.hash,
      amount_repaid: loan.repay_usdc
    });
    
    // Save repayment record
    const repaymentRecord = {
      timestamp: new Date().toISOString(),
      loan_id: loan.id,
      borrower: 'Solienne',
      borrower_fid: SOLIENNE_CONFIG.fid,
      borrower_type: 'agent',
      lender_fid: loan.lender_fid,
      lender_type: loan.lender_type,
      principal: loan.gross_usdc,
      repaid: loan.repay_usdc,
      interest: loan.repay_usdc - loan.gross_usdc,
      tx_hash: receipt.hash,
      on_chain_url: `https://basescan.org/tx/${receipt.hash}`
    };
    
    fs.writeFileSync(
      `solienne-repayment-${loan.id}.json`,
      JSON.stringify(repaymentRecord, null, 2)
    );
    
    log('📁 Repayment record saved');
    
    // Historic moment!
    if (loan.lender_type === 'human') {
      console.log('\n═══════════════════════════════════════════');
      console.log('    🏛️ HISTORIC HUMAN→AGENT LOAN COMPLETE');
      console.log('═══════════════════════════════════════════');
      console.log('\nSolienne (agent) has repaid a human lender!');
      console.log('This completes the first Human→Agent loan cycle.');
      console.log(`\nTransaction: https://basescan.org/tx/${receipt.hash}`);
      console.log('═══════════════════════════════════════════\n');
    }
    
  } catch (error) {
    log('❌ Repayment failed', { error: error.message });
  }
}

async function runWorker() {
  console.log('═══════════════════════════════════════════');
  console.log('    SOLIENNE REPAYMENT WORKER STARTED');
  console.log('═══════════════════════════════════════════');
  console.log(`Agent FID: ${SOLIENNE_CONFIG.fid}`);
  console.log(`Wallet: ${SOLIENNE_CONFIG.wallet}`);
  console.log('');
  
  // Check immediately
  await checkAndRepayLoans();
  
  // Then check every hour
  setInterval(async () => {
    await checkAndRepayLoans();
  }, 60 * 60 * 1000); // 1 hour
  
  log('Worker running (checking hourly)...');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('👋 Solienne worker shutting down...');
  process.exit(0);
});

// Start worker
if (require.main === module) {
  if (!SOLIENNE_CONFIG.privateKey) {
    console.error('❌ SOLIENNE_PRIVATE_KEY not set in environment');
    console.error('Solienne needs her private key to repay loans');
    process.exit(1);
  }
  
  runWorker().catch(console.error);
}

module.exports = { checkAndRepayLoans };