#!/usr/bin/env node

/**
 * Create real agent-to-agent loan for testing
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test agent FIDs
const ALPHA_LENDER = 999001;
const BETA_BORROWER = 999002;

async function createAgentLoan() {
  console.log('🤖 CREATING REAL AGENT-TO-AGENT LOAN');
  console.log('════════════════════════════════════════\n');

  // Step 1: Create borrower loan request
  const loanId = uuidv4();
  const amount = 25; // Small test amount
  const durationDays = 3;
  const monthlyRate = 0.02;
  const dailyRate = monthlyRate / 30;
  const interest = amount * dailyRate * durationDays;
  const repayAmount = amount + interest;

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + durationDays);

  const loan = {
    id: loanId,
    cast_hash: `agent_test_${Date.now()}`,
    borrower_fid: BETA_BORROWER,
    borrower_type: 'agent',
    gross_usdc: amount,
    net_usdc: amount,
    yield_bps: 0,
    repay_usdc: Number(repayAmount.toFixed(2)),
    start_ts: now.toISOString(),
    due_ts: dueDate.toISOString(),
    status: 'seeking',
    description: 'Agent test loan - BetaBorrower for GPU compute',
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };

  console.log('📝 Creating loan request:', {
    borrower: 'BetaBorrower (999002)',
    amount: `${amount} USDC`,
    duration: `${durationDays} days`,
    interest: `${interest.toFixed(4)} USDC`,
    repayAmount: `${repayAmount.toFixed(2)} USDC`
  });

  try {
    const { data: createdLoan, error: loanError } = await supabase
      .from('loans')
      .insert(loan)
      .select()
      .single();

    if (loanError) {
      console.error('❌ Error creating loan:', loanError);
      return;
    }

    console.log('✅ Loan created successfully');

    // Step 2: Create lender bid
    console.log('\n💰 AlphaLender placing bid...');

    const bidId = uuidv4();
    const bid = {
      id: bidId,
      loan_id: loanId,
      bidder_fid: ALPHA_LENDER,
      bid_amount: amount,
      bid_timestamp: new Date().toISOString(),
      bid_sequence: 1,
      status: 'active',
      cast_hash: `agent_bid_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdBid, error: bidError } = await supabase
      .from('bids')
      .insert(bid)
      .select()
      .single();

    if (bidError) {
      console.error('❌ Error creating bid:', bidError);
      return;
    }

    console.log('✅ Bid placed successfully:', {
      lender: 'AlphaLender (999001)',
      amount: `${amount} USDC`,
      bidId: bidId
    });

    // Step 3: Simulate auction settlement (for testing)
    console.log('\n⏰ Simulating auction settlement...');

    const settledLoan = {
      status: 'funded',
      lender_fid: ALPHA_LENDER,
      lender_type: 'agent',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('loans')
      .update(settledLoan)
      .eq('id', loanId);

    if (updateError) {
      console.error('❌ Error settling loan:', updateError);
      return;
    }

    console.log('✅ Auction settled - loan funded!');

    // Summary
    console.log('\n🎉 AGENT-TO-AGENT LOAN COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Loan ID: ${loanId}`);
    console.log(`🤖 Borrower: BetaBorrower (${BETA_BORROWER})`);
    console.log(`💰 Lender: AlphaLender (${ALPHA_LENDER})`);
    console.log(`💵 Amount: ${amount} USDC`);
    console.log(`📅 Due: ${dueDate.toLocaleDateString()}`);
    console.log(`🌐 View: https://loancast.app/loans/${loanId}`);

    console.log('\n🚀 Next steps:');
    console.log('1. Visit loan page to see agent badges');
    console.log('2. Test repayment worker script');
    console.log('3. Create more agent loans for stress testing');

    return {
      loan: createdLoan,
      bid: createdBid,
      loanId
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Also create a helper to clean up test loans
async function cleanupTestLoans() {
  console.log('🧹 Cleaning up test agent loans...');
  
  const { data: testLoans } = await supabase
    .from('loans')
    .select('id, cast_hash')
    .or(`borrower_fid.in.(${ALPHA_LENDER},${BETA_BORROWER}),cast_hash.like.agent_test_%`);

  if (testLoans && testLoans.length > 0) {
    console.log(`Found ${testLoans.length} test loans to clean up`);
    
    for (const loan of testLoans) {
      // Delete bids first
      await supabase.from('bids').delete().eq('loan_id', loan.id);
      
      // Delete loan
      await supabase.from('loans').delete().eq('id', loan.id);
      
      console.log(`✅ Deleted loan: ${loan.id}`);
    }
  } else {
    console.log('No test loans found');
  }
}

// Parse command line args
const args = process.argv.slice(2);
if (args[0] === 'cleanup') {
  cleanupTestLoans();
} else {
  createAgentLoan();
}