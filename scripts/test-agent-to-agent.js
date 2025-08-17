#!/usr/bin/env node

/**
 * Proof of concept for agent-to-agent lending
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test agents configuration
const TEST_AGENTS = {
  lender: {
    fid: 999001,
    name: 'LenderBot Alpha',
    type: 'agent',
    wallet: '0xtest_lender_wallet',
    balance: 1000, // USDC
    strategy: 'conservative',
    maxLoanSize: 100,
    minCreditScore: 500
  },
  borrower: {
    fid: 999002,
    name: 'BorrowerBot Beta',
    type: 'agent',
    wallet: '0xtest_borrower_wallet',
    creditScore: 650,
    loansRepaid: 5,
    defaulted: 0
  }
};

class AgentLendingSimulator {
  constructor() {
    this.agents = TEST_AGENTS;
    this.logs = [];
  }

  log(message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    this.logs.push(entry);
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  async simulateLoanRequest() {
    this.log('🤖 AGENT-TO-AGENT LENDING SIMULATION STARTING');
    this.log('════════════════════════════════════════════\n');

    // Step 1: Borrower agent decides to request a loan
    this.log('1️⃣ BORROWER AGENT DECISION PROCESS');
    
    const borrowerNeeds = {
      purpose: 'NFT minting costs',
      amount: 50,
      duration: 5,
      expectedROI: 15, // Expected 15 USDC profit from NFT sales
    };

    const borrowDecision = this.shouldBorrow(borrowerNeeds);
    this.log('Borrower decision:', borrowDecision);

    if (!borrowDecision.borrow) {
      this.log('❌ Borrower decided not to borrow');
      return;
    }

    // Step 2: Create loan request
    this.log('\n2️⃣ CREATING LOAN REQUEST');
    
    const loanRequest = {
      id: uuidv4(),
      borrower_fid: this.agents.borrower.fid,
      borrower_type: 'agent',
      amount: borrowerNeeds.amount,
      duration_days: borrowerNeeds.duration,
      interest_rate: 0.02, // 2% monthly
      purpose: borrowerNeeds.purpose,
      status: 'seeking',
      created_at: new Date().toISOString()
    };

    this.log('Loan request created:', loanRequest);

    // Step 3: Lender agent discovers and evaluates loan
    this.log('\n3️⃣ LENDER AGENT EVALUATION');
    
    const lendDecision = this.shouldLend(loanRequest);
    this.log('Lender evaluation:', lendDecision);

    if (!lendDecision.lend) {
      this.log('❌ Lender declined the loan');
      return;
    }

    // Step 4: Lender places bid
    this.log('\n4️⃣ LENDER PLACING BID');
    
    const bid = {
      id: uuidv4(),
      loan_id: loanRequest.id,
      lender_fid: this.agents.lender.fid,
      lender_type: 'agent',
      amount: loanRequest.amount,
      created_at: new Date().toISOString()
    };

    this.log('Bid placed:', bid);

    // Step 5: Simulate auction settlement (instant for test)
    this.log('\n5️⃣ AUCTION SETTLEMENT');
    
    const settlement = {
      loan_id: loanRequest.id,
      winning_bid: bid.id,
      settlement_time: new Date().toISOString(),
      funded_amount: bid.amount
    };

    this.log('Auction settled:', settlement);

    // Step 6: Simulate funding transfer
    this.log('\n6️⃣ FUNDING TRANSFER');
    
    const funding = {
      from: this.agents.lender.wallet,
      to: this.agents.borrower.wallet,
      amount: bid.amount,
      tx_hash: `0xtest_${Date.now()}`,
      status: 'success'
    };

    // Update balances
    this.agents.lender.balance -= bid.amount;
    this.agents.borrower.balance = (this.agents.borrower.balance || 0) + bid.amount;

    this.log('Funding complete:', funding);
    this.log('Updated balances:', {
      lender: this.agents.lender.balance,
      borrower: this.agents.borrower.balance
    });

    // Step 7: Schedule repayment
    this.log('\n7️⃣ REPAYMENT SCHEDULED');
    
    const repaymentAmount = bid.amount * (1 + 0.02 * (loanRequest.duration_days / 30));
    const repaymentDate = new Date();
    repaymentDate.setDate(repaymentDate.getDate() + loanRequest.duration_days);

    const repaymentSchedule = {
      loan_id: loanRequest.id,
      amount: repaymentAmount.toFixed(2),
      due_date: repaymentDate.toISOString(),
      status: 'scheduled'
    };

    this.log('Repayment schedule:', repaymentSchedule);

    // Step 8: Simulate repayment (instant for test)
    this.log('\n8️⃣ SIMULATING REPAYMENT');
    
    const repayment = {
      from: this.agents.borrower.wallet,
      to: this.agents.lender.wallet,
      amount: repaymentAmount,
      tx_hash: `0xtest_repay_${Date.now()}`,
      status: 'success'
    };

    // Update balances for repayment
    this.agents.borrower.balance -= repaymentAmount;
    this.agents.lender.balance += repaymentAmount;

    this.log('Repayment complete:', repayment);
    this.log('Final balances:', {
      lender: this.agents.lender.balance,
      borrower: this.agents.borrower.balance
    });

    // Step 9: Update credit scores
    this.log('\n9️⃣ UPDATING CREDIT SCORES');
    
    this.agents.borrower.loansRepaid += 1;
    this.agents.borrower.creditScore += 10; // Boost for successful repayment

    this.log('Credit updated:', {
      borrower_fid: this.agents.borrower.fid,
      loans_repaid: this.agents.borrower.loansRepaid,
      new_credit_score: this.agents.borrower.creditScore
    });

    // Step 10: Summary
    this.log('\n✅ SIMULATION COMPLETE');
    this.log('════════════════════════════════════════════');
    
    const summary = {
      loan_amount: loanRequest.amount,
      interest_paid: (repaymentAmount - loanRequest.amount).toFixed(2),
      lender_profit: (repaymentAmount - loanRequest.amount).toFixed(2),
      borrower_credit_gain: 10,
      total_time: '5 days (simulated instantly)',
      human_intervention: 'ZERO'
    };

    this.log('Summary:', summary);

    return {
      success: true,
      loan: loanRequest,
      summary
    };
  }

  shouldBorrow(needs) {
    // Borrower agent decision logic
    const canRepay = needs.expectedROI > needs.amount * 0.02; // ROI covers interest
    const needsFunds = needs.amount > 0;
    const purposeValid = needs.purpose && needs.purpose.length > 0;

    return {
      borrow: canRepay && needsFunds && purposeValid,
      reason: canRepay ? 'Expected ROI exceeds cost' : 'Insufficient expected ROI',
      confidence: canRepay ? 0.8 : 0.2
    };
  }

  shouldLend(loan) {
    // Lender agent decision logic
    const lender = this.agents.lender;
    const borrower = this.agents.borrower;

    const checks = {
      creditScore: borrower.creditScore >= lender.minCreditScore,
      loanSize: loan.amount <= lender.maxLoanSize,
      liquidity: loan.amount <= lender.balance * 0.5, // Max 50% of balance
      riskScore: this.calculateRisk(borrower, loan)
    };

    const shouldLend = checks.creditScore && checks.loanSize && checks.liquidity && checks.riskScore < 50;

    return {
      lend: shouldLend,
      checks,
      reason: shouldLend ? 'All checks passed' : 'Risk too high',
      confidence: shouldLend ? 0.7 : 0.3
    };
  }

  calculateRisk(borrower, loan) {
    // Simple risk calculation
    const creditRisk = Math.max(0, 100 - (borrower.creditScore - 300) / 5);
    const sizeRisk = loan.amount / 10; // Higher amount = higher risk
    const defaultRisk = borrower.defaulted * 20;
    
    return creditRisk * 0.5 + sizeRisk * 0.3 + defaultRisk * 0.2;
  }

  async stressTest(config = {}) {
    const { 
      numAgents = 10, 
      numTransactions = 100,
      simultaneousLoans = 5 
    } = config;

    this.log('🔥 STRESS TEST STARTING');
    this.log(`Agents: ${numAgents}, Transactions: ${numTransactions}`);
    
    const startTime = Date.now();
    const results = {
      successful: 0,
      failed: 0,
      totalVolume: 0,
      avgTime: 0
    };

    // Create agent pool
    const agents = [];
    for (let i = 0; i < numAgents; i++) {
      agents.push({
        fid: 999100 + i,
        type: Math.random() > 0.5 ? 'lender' : 'borrower',
        balance: Math.random() * 1000 + 100,
        creditScore: Math.random() * 300 + 500
      });
    }

    // Simulate transactions
    for (let i = 0; i < numTransactions; i++) {
      const borrower = agents.find(a => a.type === 'borrower');
      const lender = agents.find(a => a.type === 'lender' && a.balance > 10);

      if (borrower && lender) {
        // Simulate loan
        const amount = Math.random() * 50 + 10;
        results.totalVolume += amount;
        results.successful++;
      } else {
        results.failed++;
      }

      // Log progress every 10 transactions
      if (i % 10 === 0) {
        this.log(`Progress: ${i}/${numTransactions} transactions`);
      }
    }

    const endTime = Date.now();
    results.avgTime = (endTime - startTime) / numTransactions;

    this.log('\n📊 STRESS TEST RESULTS');
    this.log('═══════════════════════════════════════════');
    this.log(`Successful: ${results.successful}`);
    this.log(`Failed: ${results.failed}`);
    this.log(`Total Volume: $${results.totalVolume.toFixed(2)}`);
    this.log(`Avg Time: ${results.avgTime.toFixed(2)}ms per transaction`);
    this.log(`TPS: ${(1000 / results.avgTime).toFixed(2)} transactions/second`);

    return results;
  }
}

// Run simulation
async function main() {
  const simulator = new AgentLendingSimulator();
  
  // Run simple simulation
  console.log('\n🤖 SIMPLE AGENT-TO-AGENT TEST\n');
  await simulator.simulateLoanRequest();
  
  // Ask if user wants to run stress test
  console.log('\n\nRun stress test? (Uncomment line below)');
  // await simulator.stressTest({ numAgents: 20, numTransactions: 100 });
}

main().catch(console.error);