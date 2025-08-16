#!/usr/bin/env node

/**
 * Create Solienne's loan request
 * 50 USDC @ 500bps for 7 days
 * Working capital for print run
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '../../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LOAN_PARAMS = {
  borrower_fid: 1113468, // Solienne
  amount: 50,
  yield_bps: 500, // 5%
  duration_days: 7,
  memo: "Working capital for Solienne print run · 🧑→🤖 pilot"
};

async function createSolienneLoan() {
  console.log('\n📝 CREATING SOLIENNE\'S LOAN REQUEST\n');
  
  const loanId = crypto.randomUUID();
  const now = new Date();
  const dueDate = new Date(now.getTime() + LOAN_PARAMS.duration_days * 86400 * 1000);
  
  // Calculate repayment
  const interest = LOAN_PARAMS.amount * (LOAN_PARAMS.yield_bps / 10000) * (LOAN_PARAMS.duration_days / 365);
  const repayAmount = LOAN_PARAMS.amount + interest;
  
  const loanData = {
    id: loanId,
    cast_hash: `solienne_loan_${Date.now()}`,
    borrower_fid: LOAN_PARAMS.borrower_fid,
    borrower_type: 'agent',
    gross_usdc: LOAN_PARAMS.amount,
    net_usdc: LOAN_PARAMS.amount,
    yield_bps: LOAN_PARAMS.yield_bps,
    repay_usdc: repayAmount,
    start_ts: now.toISOString(),
    due_ts: dueDate.toISOString(),
    status: 'seeking',
    loan_number: 300000 + Math.floor(Math.random() * 1000),
    description: LOAN_PARAMS.memo,
    requested_usdc: LOAN_PARAMS.amount
  };
  
  console.log('Loan Details:');
  console.log(`   Borrower: Solienne (Agent #${LOAN_PARAMS.borrower_fid})`);
  console.log(`   Amount: ${LOAN_PARAMS.amount} USDC`);
  console.log(`   Rate: ${LOAN_PARAMS.yield_bps}bps (${LOAN_PARAMS.yield_bps/100}%)`);
  console.log(`   Duration: ${LOAN_PARAMS.duration_days} days`);
  console.log(`   Repayment: ${repayAmount.toFixed(2)} USDC`);
  console.log(`   Memo: "${LOAN_PARAMS.memo}"`);
  console.log('');
  
  const { data: loan, error } = await supabase
    .from('loans')
    .insert(loanData)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to create loan:', error.message);
    return null;
  }
  
  console.log('✅ Loan request created successfully!');
  console.log(`   Loan ID: ${loan.id}`);
  console.log(`   Status: ${loan.status}`);
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Copy this loan ID:', loan.id);
  console.log('2. Run fund-loan.js with your wallet');
  console.log('3. Solienne will repay automatically in 7 days');
  console.log('');
  console.log('🔗 View on LoanCast:');
  console.log(`   https://loancast.app/loans/${loan.id}`);
  
  // Save loan details for later reference
  const fs = require('fs');
  fs.writeFileSync('solienne-loan.json', JSON.stringify({
    loan_id: loan.id,
    borrower: 'Solienne',
    borrower_fid: LOAN_PARAMS.borrower_fid,
    amount: LOAN_PARAMS.amount,
    rate: LOAN_PARAMS.yield_bps,
    due_date: dueDate.toISOString(),
    repay_amount: repayAmount,
    created_at: now.toISOString()
  }, null, 2));
  
  console.log('\n📁 Loan details saved to solienne-loan.json');
  
  return loan;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('    SOLIENNE LOAN REQUEST (HUMAN→AGENT)');
  console.log('═══════════════════════════════════════════');
  
  const loan = await createSolienneLoan();
  
  if (loan) {
    console.log('\n🎯 Ready for human funding!');
    console.log('This will be the first Human→Agent loan on LoanCast.');
  }
}

main().catch(console.error);