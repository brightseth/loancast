#!/usr/bin/env node

/**
 * Fund Solienne's loan as a human
 * This completes the Human→Agent transaction
 */

const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config({ path: '../../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Your configuration as human lender
const LENDER_CONFIG = {
  fid: parseInt(process.env.YOUR_FID || '12345'), // Your Farcaster FID
  wallet: process.env.YOUR_WALLET, // Your Base wallet address
  privateKey: process.env.YOUR_PRIVATE_KEY // Your private key
};

// USDC on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function fundSolienneLoan(loanId) {
  console.log('\n💰 FUNDING SOLIENNE\'S LOAN (HUMAN→AGENT)\n');
  
  if (!loanId) {
    // Try to load from saved file
    try {
      const saved = JSON.parse(fs.readFileSync('solienne-loan.json', 'utf8'));
      loanId = saved.loan_id;
      console.log(`Using saved loan ID: ${loanId}`);
    } catch {
      console.error('❌ No loan ID provided or found');
      console.log('Usage: node fund-loan.js <loan-id>');
      return;
    }
  }
  
  // Fetch loan details
  const { data: loan, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .single();
  
  if (error || !loan) {
    console.error('❌ Loan not found:', loanId);
    return;
  }
  
  console.log('Loan Details:');
  console.log(`   ID: ${loan.id}`);
  console.log(`   Borrower: Solienne (Agent #${loan.borrower_fid})`);
  console.log(`   Amount: ${loan.gross_usdc} USDC`);
  console.log(`   Rate: ${loan.yield_bps}bps`);
  console.log(`   Status: ${loan.status}`);
  console.log('');
  
  if (loan.status !== 'seeking') {
    console.log('⚠️ Loan is not seeking funding');
    return;
  }
  
  // Get Solienne's wallet
  const { data: solienneAgent } = await supabase
    .from('agents')
    .select('wallet')
    .eq('agent_fid', loan.borrower_fid)
    .single();
  
  if (!solienneAgent?.wallet) {
    console.error('❌ Solienne wallet not found');
    return;
  }
  
  console.log(`Solienne's wallet: ${solienneAgent.wallet}`);
  console.log(`Your wallet: ${LENDER_CONFIG.wallet}`);
  console.log('');
  
  // Record funding intent
  console.log('📝 Recording funding intent...');
  await supabase
    .from('funding_intents')
    .insert({
      loan_id: loan.id,
      lender_fid: LENDER_CONFIG.fid,
      lender_type: 'human'
    });
  console.log('✅ Intent recorded');
  
  // Execute on-chain transfer
  if (LENDER_CONFIG.privateKey) {
    console.log('\n💸 Sending USDC on Base...');
    
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.BASE_RPC_URL || 'https://mainnet.base.org'
      );
      const wallet = new ethers.Wallet(LENDER_CONFIG.privateKey, provider);
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
      
      // Check balance
      const balance = await usdc.balanceOf(wallet.address);
      const amount = ethers.parseUnits(loan.gross_usdc.toString(), 6);
      
      console.log(`Your USDC balance: ${ethers.formatUnits(balance, 6)}`);
      
      if (balance < amount) {
        console.error('❌ Insufficient USDC balance');
        return;
      }
      
      // Send USDC
      const tx = await usdc.transfer(solienneAgent.wallet, amount);
      console.log(`Transaction submitted: ${tx.hash}`);
      console.log('Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!');
      console.log(`Block: ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      
      // Update loan status
      await supabase
        .from('loans')
        .update({
          status: 'funded',
          lender_fid: LENDER_CONFIG.fid,
          lender_type: 'human',
          lender_address: LENDER_CONFIG.wallet, // Store for repayment
          tx_fund: receipt.hash,
          funded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', loan.id);
      
      console.log('\n✅ LOAN FUNDED SUCCESSFULLY!');
      console.log(`Transaction: https://basescan.org/tx/${receipt.hash}`);
      
      // Save funding record
      const fundingRecord = {
        loan_id: loan.id,
        lender_fid: LENDER_CONFIG.fid,
        lender_type: 'human',
        lender_wallet: LENDER_CONFIG.wallet,
        borrower: 'Solienne',
        borrower_fid: loan.borrower_fid,
        borrower_type: 'agent',
        amount: loan.gross_usdc,
        tx_hash: receipt.hash,
        funded_at: new Date().toISOString()
      };
      
      fs.writeFileSync('funding-record.json', JSON.stringify(fundingRecord, null, 2));
      console.log('\n📁 Funding record saved to funding-record.json');
      
    } catch (error) {
      console.error('❌ Transfer failed:', error.message);
    }
  } else {
    console.log('\n⚠️ No private key provided - manual funding required');
    console.log('Send', loan.gross_usdc, 'USDC to:', solienneAgent.wallet);
    console.log('Then update loan status with transaction hash');
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('    🏛️ HISTORIC HUMAN→AGENT LOAN');
  console.log('═══════════════════════════════════════════');
  console.log('\nYou (human) have funded Solienne (agent)!');
  console.log('She will repay automatically in 7 days.');
  console.log('\nThis is the first Human→Agent loan on LoanCast.');
}

// Run
const loanId = process.argv[2];
fundSolienneLoan(loanId).catch(console.error);