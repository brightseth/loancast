#!/usr/bin/env node

/**
 * Agent monitoring loop for autonomous Farcaster lending
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { NeynarAPIClient } = require('@neynar/nodejs-sdk');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

// Test agent configurations (would be real FIDs in production)
const AGENTS = {
  999001: {
    name: 'LoanBotAlpha',
    strategy: 'conservative_lender',
    balance: 500,
    maxLoanSize: 100,
    minCreditScore: 600,
    enabled: true
  },
  999002: {
    name: 'LoanBotBeta', 
    strategy: 'active_borrower',
    creditScore: 650,
    enabled: true
  },
  999003: {
    name: 'LoanBotGamma',
    strategy: 'hybrid_trader',
    balance: 300,
    creditScore: 700,
    enabled: true
  }
};

class AgentMonitoringLoop {
  constructor() {
    this.agents = AGENTS;
    this.running = false;
    this.lastCheckTime = new Date();
    this.stats = {
      loansEvaluated: 0,
      bidsPlaced: 0,
      loansCreated: 0,
      errors: 0
    };
  }

  log(message, data = {}) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('  ', JSON.stringify(data, null, 2));
    }
  }

  async start() {
    this.log('🚀 Starting agent monitoring loop...');
    this.running = true;

    while (this.running) {
      try {
        await this.monitoringCycle();
        await this.sleep(30000); // 30 second cycle
      } catch (error) {
        this.log('❌ Error in monitoring cycle:', error.message);
        this.stats.errors++;
        await this.sleep(10000); // Shorter sleep on error
      }
    }
  }

  async monitoringCycle() {
    this.log('🔍 Running monitoring cycle...');

    // 1. Check for new loan requests
    await this.checkForNewLoans();

    // 2. Check for borrowing opportunities for agents
    await this.checkBorrowingNeeds();

    // 3. Process settlements and acknowledgments
    await this.processSettlements();

    // 4. Handle repayments
    await this.processRepayments();

    // 5. Update agent states
    await this.updateAgentStates();

    this.lastCheckTime = new Date();
  }

  async checkForNewLoans() {
    // Check for new loans since last cycle
    const { data: newLoans, error } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'seeking')
      .gte('created_at', this.lastCheckTime.toISOString())
      .neq('borrower_type', 'agent'); // Don't bid on our own agent loans for now

    if (error) {
      this.log('❌ Error fetching new loans:', error.message);
      return;
    }

    if (!newLoans || newLoans.length === 0) {
      return; // No new loans
    }

    this.log(`📋 Found ${newLoans.length} new loan(s) to evaluate`);

    for (const loan of newLoans) {
      await this.evaluateLoanForAgents(loan);
      this.stats.loansEvaluated++;
    }
  }

  async evaluateLoanForAgents(loan) {
    this.log(`🔍 Evaluating loan ${loan.id} (${loan.gross_usdc} USDC)`);

    // Get agents that can lend
    const lendingAgents = Object.entries(this.agents).filter(([fid, agent]) => 
      agent.enabled && (agent.strategy === 'conservative_lender' || agent.strategy === 'hybrid_trader')
    );

    for (const [fid, agent] of lendingAgents) {
      const decision = await this.evaluateLoanForAgent(agent, loan);
      
      if (decision.shouldBid) {
        await this.placeBidForAgent(agent, loan, decision);
      }
    }
  }

  async evaluateLoanForAgent(agent, loan) {
    // Risk assessment
    const riskFactors = {
      amount: Math.min((loan.gross_usdc / agent.maxLoanSize) * 40, 40),
      duration: this.calculateDurationRisk(loan),
      borrowerType: loan.borrower_type === 'agent' ? 5 : 15, // Agents are lower risk
      purpose: this.calculatePurposeRisk(loan.description || '')
    };

    const totalRisk = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0);

    // Strategy-based decision
    const riskTolerance = agent.strategy === 'conservative_lender' ? 25 : 
                         agent.strategy === 'hybrid_trader' ? 40 : 50;

    const shouldBid = totalRisk < riskTolerance && 
                     loan.gross_usdc <= (agent.maxLoanSize || 100) &&
                     loan.gross_usdc <= (agent.balance || 0) * 0.3; // Max 30% of balance

    return {
      shouldBid,
      riskScore: totalRisk,
      bidAmount: shouldBid ? this.calculateBidAmount(agent, loan) : 0,
      confidence: shouldBid ? Math.max(0.1, 1 - (totalRisk / 100)) : 0
    };
  }

  calculateDurationRisk(loan) {
    const durationDays = this.getDurationInDays(loan.start_ts, loan.due_ts);
    if (durationDays <= 3) return 5;
    if (durationDays <= 7) return 10;
    if (durationDays <= 14) return 20;
    return 30;
  }

  calculatePurposeRisk(description) {
    const riskKeywords = {
      'arbitrage': 25,
      'trading': 20,
      'gambling': 40,
      'leverage': 35,
      'nft': 15,
      'compute': 10,
      'server': 5,
      'development': 5
    };

    for (const [keyword, risk] of Object.entries(riskKeywords)) {
      if (description.toLowerCase().includes(keyword)) {
        return risk;
      }
    }
    return 15; // Default risk
  }

  calculateBidAmount(agent, loan) {
    // Conservative agents bid 80-90%, aggressive bid full amount
    const multiplier = agent.strategy === 'conservative_lender' ? 
                      0.8 + Math.random() * 0.1 : // 80-90%
                      0.95 + Math.random() * 0.05; // 95-100%
    
    return Math.floor(loan.gross_usdc * multiplier);
  }

  async placeBidForAgent(agent, loan, decision) {
    this.log(`💰 ${agent.name} placing bid: ${decision.bidAmount} USDC (confidence: ${decision.confidence.toFixed(2)})`);

    // In production, this would place a real bid
    // For now, we'll just log the action and create a mock bid

    const bid = {
      loan_id: loan.id,
      bidder_fid: parseInt(Object.keys(this.agents).find(fid => this.agents[fid] === agent)),
      bid_amount: decision.bidAmount,
      bid_timestamp: new Date().toISOString(),
      bid_sequence: 1,
      status: 'active',
      cast_hash: `agent_bid_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('bids')
        .insert(bid);

      if (error) {
        this.log('❌ Error placing bid:', error.message);
        return;
      }

      this.log(`✅ Bid placed successfully by ${agent.name}`);
      this.stats.bidsPlaced++;

      // In production, would also post to Farcaster:
      // await this.postBidCast(agent, loan, decision.bidAmount);

    } catch (error) {
      this.log('❌ Unexpected error placing bid:', error.message);
    }
  }

  async checkBorrowingNeeds() {
    // Check if any agents need to borrow
    const borrowingAgents = Object.entries(this.agents).filter(([fid, agent]) => 
      agent.enabled && (agent.strategy === 'active_borrower' || agent.strategy === 'hybrid_trader')
    );

    for (const [fid, agent] of borrowingAgents) {
      const shouldBorrow = await this.shouldAgentBorrow(agent);
      
      if (shouldBorrow.borrow) {
        await this.createLoanForAgent(agent, shouldBorrow);
      }
    }
  }

  async shouldAgentBorrow(agent) {
    // Simple borrowing logic - in production would be more sophisticated
    
    // Check if agent has active loans
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('id')
      .eq('borrower_fid', parseInt(Object.keys(this.agents).find(fid => this.agents[fid] === agent)))
      .in('status', ['seeking', 'funded']);

    if (activeLoans && activeLoans.length > 0) {
      return { borrow: false, reason: 'Already has active loan' };
    }

    // Random borrowing for demo (5% chance per cycle)
    const shouldBorrow = Math.random() < 0.05;
    
    if (shouldBorrow) {
      const purposes = agent.strategy === 'active_borrower' ? 
        ['NFT minting costs', 'GPU compute credits', 'Content creation tools'] :
        ['Arbitrage opportunity', 'Yield farming capital', 'Trading position'];

      return {
        borrow: true,
        amount: 25 + Math.floor(Math.random() * 75), // 25-100 USDC
        duration: agent.strategy === 'hybrid_trader' ? 1 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 11), // 1-3 days for traders, 3-14 for others
        purpose: purposes[Math.floor(Math.random() * purposes.length)]
      };
    }

    return { borrow: false, reason: 'No borrowing need detected' };
  }

  async createLoanForAgent(agent, borrowRequest) {
    this.log(`📝 ${agent.name} creating loan request: ${borrowRequest.amount} USDC for ${borrowRequest.duration}d`);

    const agentFid = parseInt(Object.keys(this.agents).find(fid => this.agents[fid] === agent));
    
    // Use existing loan creation logic
    const loanId = require('uuid').v4();
    const amount = borrowRequest.amount;
    const durationDays = borrowRequest.duration;
    const monthlyRate = 0.02;
    const dailyRate = monthlyRate / 30;
    const interest = amount * dailyRate * durationDays;
    const repayAmount = amount + interest;

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + durationDays);

    const loan = {
      id: loanId,
      cast_hash: `agent_auto_${Date.now()}`,
      borrower_fid: agentFid,
      borrower_type: 'agent',
      gross_usdc: amount,
      net_usdc: amount,
      yield_bps: 0,
      repay_usdc: Number(repayAmount.toFixed(2)),
      start_ts: now.toISOString(),
      due_ts: dueDate.toISOString(),
      status: 'seeking',
      description: `${agent.name}: ${borrowRequest.purpose}`,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    try {
      const { error } = await supabase
        .from('loans')
        .insert(loan);

      if (error) {
        this.log('❌ Error creating loan:', error.message);
        return;
      }

      this.log(`✅ Loan created by ${agent.name}: ${amount} USDC`);
      this.stats.loansCreated++;

      // In production, would post to Farcaster:
      // await this.postLoanRequestCast(agent, borrowRequest);

    } catch (error) {
      this.log('❌ Unexpected error creating loan:', error.message);
    }
  }

  async processSettlements() {
    // Check for newly settled loans that need acknowledgment
    // Implementation would handle thank you casts, etc.
  }

  async processRepayments() {
    // Check for loans approaching due dates
    // Implementation would handle repayment processing
  }

  async updateAgentStates() {
    // Update agent balances, credit scores, etc.
    // Implementation would sync with actual wallet balances
  }

  getDurationInDays(startTs, dueTs) {
    const start = new Date(startTs);
    const due = new Date(dueTs);
    return Math.ceil((due - start) / (1000 * 60 * 60 * 24));
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.log('🛑 Stopping agent monitoring loop...');
    this.running = false;
  }

  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime,
      lastCheck: this.lastCheckTime
    };
  }
}

// Main execution
async function main() {
  console.log('🤖 AGENT MONITORING LOOP');
  console.log('════════════════════════════════════════\n');

  const monitor = new AgentMonitoringLoop();
  monitor.startTime = Date.now();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stop();
    console.log('\n📊 Final stats:', monitor.getStats());
    process.exit(0);
  });

  // Start monitoring
  await monitor.start();
}

// Allow running as script or importing as module
if (require.main === module) {
  main().catch(console.error);
} else {
  module.exports = { AgentMonitoringLoop };
}