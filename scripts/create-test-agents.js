#!/usr/bin/env node

/**
 * Create test agents for agent-to-agent lending demonstration
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test agents configuration
const TEST_AGENTS = [
  {
    fid: 999001,
    name: 'AlphaLender',
    type: 'lender',
    strategy: 'conservative',
    wallet: '0xtest_alpha_lender_wallet',
    balance: 1000, // USDC
    maxLoanSize: 100,
    minCreditScore: 500,
    description: 'Conservative lending AI focused on low-risk loans'
  },
  {
    fid: 999002,
    name: 'BetaBorrower',
    type: 'borrower',
    strategy: 'frequent',
    wallet: '0xtest_beta_borrower_wallet',
    creditScore: 650,
    loansRepaid: 5,
    defaulted: 0,
    description: 'Active borrower AI for NFT creation projects'
  },
  {
    fid: 999003,
    name: 'GammaTrader',
    type: 'hybrid',
    strategy: 'opportunistic',
    wallet: '0xtest_gamma_trader_wallet',
    balance: 500,
    creditScore: 700,
    loansRepaid: 8,
    defaulted: 0,
    description: 'Hybrid agent that both borrows and lends based on opportunities'
  },
  {
    fid: 999004,
    name: 'DeltaCreator',
    type: 'borrower',
    strategy: 'creative',
    wallet: '0xtest_delta_creator_wallet',
    creditScore: 600,
    loansRepaid: 3,
    defaulted: 0,
    description: 'AI agent focused on borrowing for creative content generation'
  },
  {
    fid: 999005,
    name: 'EpsilonBank',
    type: 'lender',
    strategy: 'aggressive',
    wallet: '0xtest_epsilon_bank_wallet',
    balance: 2000,
    maxLoanSize: 300,
    minCreditScore: 400,
    description: 'High-volume lending AI with risk tolerance'
  }
];

class TestAgentManager {
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

  async createAgents() {
    this.log('🤖 CREATING TEST AGENTS FOR AUTONOMOUS LENDING');
    this.log('══════════════════════════════════════════════\n');

    const results = [];

    for (const agent of this.agents) {
      this.log(`Creating agent: ${agent.name} (${agent.type})`);
      
      // Create agent profile
      const agentProfile = {
        id: uuidv4(),
        fid: agent.fid,
        name: agent.name,
        type: agent.type,
        strategy: agent.strategy,
        wallet_address: agent.wallet,
        balance_usdc: agent.balance || 0,
        credit_score: agent.creditScore || 500,
        loans_repaid: agent.loansRepaid || 0,
        loans_defaulted: agent.defaulted || 0,
        max_loan_size: agent.maxLoanSize || 50,
        min_credit_score: agent.minCreditScore || 400,
        description: agent.description,
        active: true,
        created_at: new Date().toISOString()
      };

      try {
        // Note: We'll store in a test_agents table or just track locally
        this.log(`✅ Agent ${agent.name} profile created`, {
          fid: agent.fid,
          type: agent.type,
          balance: agent.balance || 0,
          creditScore: agent.creditScore || 500
        });

        results.push({
          success: true,
          agent: agentProfile
        });

      } catch (error) {
        this.log(`❌ Failed to create agent ${agent.name}:`, error.message);
        results.push({
          success: false,
          agent: agent.name,
          error: error.message
        });
      }
    }

    this.log('\n📊 AGENT CREATION SUMMARY');
    this.log('═════════════════════════════════════════');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    this.log(`✅ Successfully created: ${successful} agents`);
    this.log(`❌ Failed: ${failed} agents`);

    return results;
  }

  async simulateAgentDecisions() {
    this.log('\n🧠 SIMULATING AGENT DECISION MAKING');
    this.log('═══════════════════════════════════════════\n');

    // Simulate borrower needs
    const borrowingNeeds = [
      {
        agent: 'BetaBorrower',
        purpose: 'NFT minting batch',
        amount: 75,
        duration: 7,
        expectedROI: 20
      },
      {
        agent: 'DeltaCreator', 
        purpose: 'GPU compute credits',
        amount: 40,
        duration: 3,
        expectedROI: 8
      },
      {
        agent: 'GammaTrader',
        purpose: 'Arbitrage opportunity',
        amount: 120,
        duration: 1,
        expectedROI: 15
      }
    ];

    for (const need of borrowingNeeds) {
      this.log(`${need.agent} analyzing borrowing need:`, need);
      
      // Simulate decision logic
      const costOfCapital = need.amount * 0.02 * (need.duration / 30); // 2% monthly
      const netProfit = need.expectedROI - costOfCapital;
      const shouldBorrow = netProfit > 0;

      this.log(`Decision: ${shouldBorrow ? '✅ BORROW' : '❌ SKIP'}`, {
        costOfCapital: costOfCapital.toFixed(2),
        expectedProfit: need.expectedROI,
        netProfit: netProfit.toFixed(2),
        reason: shouldBorrow ? 'Profitable after interest' : 'Insufficient ROI'
      });

      if (shouldBorrow) {
        // Create loan request via API
        const loanRequest = {
          agent_fid: this.agents.find(a => a.name === need.agent)?.fid,
          amount_usdc: need.amount,
          duration_days: need.duration,
          purpose: need.purpose
        };

        this.log(`📝 Would create loan via API:`, loanRequest);
      }
    }

    // Simulate lender responses
    this.log('\n💰 SIMULATING LENDER RESPONSES');
    this.log('════════════════════════════════════════');

    const lenders = this.agents.filter(a => a.type === 'lender' || a.type === 'hybrid');
    
    for (const need of borrowingNeeds.filter(n => {
      const costOfCapital = n.amount * 0.02 * (n.duration / 30);
      return n.expectedROI > costOfCapital;
    })) {
      
      this.log(`\nEvaluating loan: ${need.amount} USDC for ${need.duration}d`);
      
      for (const lender of lenders) {
        const riskScore = this.calculateRisk(need);
        const expectedReturn = need.amount * 0.02 * (need.duration / 30);
        const liquidityCheck = need.amount <= (lender.balance || 0) * 0.3;
        
        const shouldLend = riskScore < 50 && liquidityCheck && 
                          (lender.strategy === 'aggressive' || riskScore < 30);

        this.log(`${lender.name}: ${shouldLend ? '✅ BID' : '❌ PASS'}`, {
          riskScore,
          expectedReturn: expectedReturn.toFixed(2),
          liquidityOk: liquidityCheck,
          strategy: lender.strategy
        });
      }
    }
  }

  calculateRisk(need) {
    // Simple risk calculation
    const sizeRisk = Math.min(need.amount / 10, 40); // Size penalty
    const durationRisk = need.duration > 7 ? 20 : 5; // Duration penalty
    const purposeRisk = need.purpose.includes('arbitrage') ? 30 : 10; // Purpose risk
    
    return sizeRisk + durationRisk + purposeRisk;
  }

  async runAutonomousDemo() {
    this.log('\n🚀 RUNNING AUTONOMOUS AGENT DEMO');
    this.log('═══════════════════════════════════════════\n');

    // Create loan request
    const borrower = this.agents.find(a => a.name === 'BetaBorrower');
    const lenders = this.agents.filter(a => a.type === 'lender');

    const loanRequest = {
      id: uuidv4(),
      borrower_fid: borrower.fid,
      borrower_type: 'agent',
      amount: 50,
      duration_days: 5,
      purpose: 'Autonomous test transaction',
      status: 'seeking'
    };

    this.log('📝 Loan request created:', loanRequest);

    // Simulate bidding
    const bids = [];
    for (const lender of lenders) {
      if (Math.random() > 0.3) { // 70% chance to bid
        const bid = {
          id: uuidv4(),
          loan_id: loanRequest.id,
          lender_fid: lender.fid,
          lender_type: 'agent',
          amount: Math.floor(loanRequest.amount * (0.8 + Math.random() * 0.4)),
          created_at: new Date().toISOString()
        };
        bids.push(bid);
        this.log(`💰 ${lender.name} placed bid:`, bid);
      }
    }

    // Simulate settlement
    if (bids.length > 0) {
      const winningBid = bids.reduce((max, bid) => bid.amount > max.amount ? bid : max);
      const winner = this.agents.find(a => a.fid === winningBid.lender_fid);
      
      this.log('\n🏆 AUCTION SETTLED', {
        winner: winner.name,
        amount: winningBid.amount,
        totalBids: bids.length
      });

      // Simulate funding
      this.log('💸 Funding transfer simulated');
      
      // Simulate repayment scheduling
      const repayAmount = winningBid.amount * (1 + 0.02 * (loanRequest.duration_days / 30));
      this.log('📅 Repayment scheduled', {
        amount: repayAmount.toFixed(2),
        dueIn: `${loanRequest.duration_days} days`
      });

      this.log('\n✅ AUTONOMOUS TRANSACTION COMPLETE');
      this.log('🤖↔️🤖 Zero human intervention required!');
    } else {
      this.log('❌ No bids received - adjust risk parameters');
    }
  }
}

async function main() {
  const manager = new TestAgentManager();
  
  console.log('🤖 TEST AGENT CREATION & SIMULATION\n');
  
  // Create agents
  await manager.createAgents();
  
  // Simulate decision making
  await manager.simulateAgentDecisions();
  
  // Run autonomous demo
  await manager.runAutonomousDemo();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Create real loan via: node scripts/test-agent-to-agent.js');
  console.log('2. Start agent lending loop: npm run agents:start');
  console.log('3. Monitor dashboard: loancast.app/admin/agents');
  console.log('\n🚀 Ready for agent-to-agent lending stress test!');
}

main().catch(console.error);