# LoanCast Protocol: Social Credit for the Network Age

## Abstract

Traditional credit systems fail the globally connected yet locally trusted communities emerging on decentralized social networks. LoanCast Protocol transforms social capital into financial capital by enabling uncollateralized peer-to-peer lending directly within Farcaster's social graph. Each loan request becomes a collectible cast, creating an immutable public record where reputation—not assets—serves as collateral. Early results show 100% repayment rates among identity-verified social network participants, suggesting that public social consequences effectively replace legal enforcement mechanisms when loan sizes match social trust thresholds.

## 1. The Credit Access Problem

Modern credit infrastructure excludes billions despite ubiquitous digital connectivity. Traditional lenders require extensive documentation, credit history, and often collateral worth 150% of the loan value. Web2 peer-to-peer platforms like Prosper and LendingClub promised democratization but devolved into institutional investment vehicles with complex securities regulations and 36% default rates among anonymous borrowers.

Meanwhile, informal social lending thrives. Rotating savings groups (ROSCAs) move $100B+ annually. Friends Venmo rent money. Communities fund emergencies through GoFundMe. Yet these trust-based transactions build no portable credit history, create no reputation value, and remain invisible to the formal financial system.

The core insight: **identity persistence changes everything**. When borrowers can't simply create new accounts after defaulting, when their entire social graph witnesses their financial behavior, when future access to community resources depends on past performance—social capital becomes effective collateral.

## 2. The LoanCast Solution

LoanCast Protocol leverages Farcaster's persistent identity system and native collectible mechanism to create frictionless social lending. The innovation is architectural simplicity: the cast itself becomes the loan contract.

**How it works:**
1. **Borrower** posts a loan request as a Farcaster collectible specifying amount (≤$1000), duration (≤30 days), and interest rate
2. **Lenders** participate in a 24-hour auction; highest bidder wins the collectible NFT
3. **Settlement** occurs instantly via USDC on Base; borrower receives funds minus Farcaster's 10% fee
4. **Repayment** triggers on-chain confirmation and reputation score update
5. **Default** results in permanent on-chain badge and social graph notification

**The collectible cast innovation** solves multiple problems:
- **Price discovery**: Auction mechanism naturally prices credit risk
- **Social proof**: Public casts create community accountability  
- **Regulatory clarity**: Direct peer-to-peer transfer avoids pooling/securities issues
- **Distribution**: Loan requests appear natively in social feeds

## 3. Protocol Architecture

LoanCast operates as a thin protocol layer atop existing infrastructure:

**Core Components:**
- **Identity**: Farcaster IDs (FIDs) provide cryptographically-controlled persistent identity
- **Settlement**: USDC on Base enables instant, global, programmable payments
- **Reputation**: On-chain scoring system weights social graph (40%), payment history (40%), account age (20%)
- **Enforcement**: Smart contracts automate badge assignment; social layer handles consequences

**Key Design Decisions:**
- **No custody**: Protocol never holds user funds
- **No pooling**: Each loan is a direct peer-to-peer transaction
- **No intermediation**: Platform provides UI/indexing only
- **Open source**: Anyone can build alternative interfaces

**Reputation Mechanics:**
```
Score = 400 * (followers/1000)^0.5 + 
        400 * (successful_loans/total_loans) + 
        200 * (account_age_days/365)
        
Max loan = $200 (Score 0-599) | $500 (600-799) | $1000 (800+)
```

## 4. Early Results and Network Effects

**Genesis Period (Aug-Sept 2025):**
- First loan (LOANCAST-001): $789 borrowed, repaid on time
- 10 subsequent loans: 100% repayment rate
- Average funding time: 4.2 hours
- Viral coefficient: Each loan generates 2.3 new users

**Emerging Behaviors:**
- Borrowers compete on reputation not just rates
- Lenders diversify across multiple small loans
- Community self-polices suspicious requests
- Repayment casts become social proof

**Network effects compound quickly:**
- Each successful loan increases system trust
- Public defaults educate risk assessment
- Reputation scores become social currency
- Integration opportunities multiply (DAOs, creators, merchants)

## 5. Regulatory Approach

LoanCast operates in the regulatory gap between social payments and securities:

**Key Protections:**
- True peer-to-peer: No pooling or note reselling
- Small amounts: Max $1000 keeps below most regulatory thresholds
- Social context: Positions as "friends helping friends"
- Protocol layer: Decentralized architecture resists single points of control

**Compliance Strategy:**
- Monitor SEC guidance on DeFi lending
- Maintain dialogue with innovation offices
- Implement geographic restrictions if required
- Preserve option to transition to DAO governance

## 6. Future Directions

**Technical Roadmap:**
- Cross-chain reputation bridges (Lens, ENS)
- Privacy-preserving proofs for sensitive loans
- Automated insurance pools for lender protection
- SDK for community-specific implementations

**Market Expansion:**
- Creator advances against future content revenue
- DAO treasury management via member lending
- Merchant credit for on-chain commerce
- International remittance via social vouching

**The Bigger Vision:**
LoanCast demonstrates that reputation can replace collateral when identity persists and communities witness. As online identity becomes primary identity, as social graphs become economic graphs, as trust becomes computable—every community becomes a credit union, every reputation becomes a credit score, every social network becomes a financial network.

The protocol layer for social credit now exists. The experiment begins.

---

*LoanCast Protocol v0.9 | Open source: github.com/loancast/protocol | Live on Farcaster: loancast.app*

## Appendix: LoanCast Protocol (LCP) v0.1

### LCP-01: Loan Registration Semantics

The minimal on-chain truth layer consists of a LoanRegistry contract that tracks:
- Loan hash (keccak256 of terms)
- Borrower address (derived from FID)
- Lender address (when funded)
- Status (seeking/funded/repaid/defaulted)
- Amount in USDC (6 decimals)

```solidity
struct Loan {
    bytes32 loanHash;
    address borrower;
    address lender;
    uint256 principal_usdc_6;
    uint256 repay_usdc_6;
    uint32 due_ts;
    Status status;
}
```

Loans are registered on-chain only when funded, creating an immutable record of the funding event. The loan hash links to off-chain metadata stored in IPFS or directly in Farcaster casts.

### LCP-02: Repayment Routing

Repayments flow through a RepaymentRouter contract that:
1. Accepts USDC from borrower
2. Validates loan exists and is funded
3. Routes principal + interest to lender
4. Marks loan as repaid in registry
5. Emits RepaymentComplete event

The router implements single-shot repayment via Router in v0.1. Future versions (v0.2+) will support:
- Partial/installment payments
- Grace periods with penalties
- Automated liquidation triggers

### LCP-03: Agent Framework

AI agents participate through standardized interfaces:

**Agent Registration:**
- Controller FID owns the agent
- Agent FID provides identity
- ERC-4337 wallet enables autonomous operation
- Policy engine defines lending criteria

**Agent Types:**
- **Yield Optimizers**: Maximize APR across all loans
- **Arbitrage Bots**: Exploit rate differentials
- **Liquidity Providers**: Ensure market depth
- **Reputation Validators**: Score borrower creditworthiness
- **Market Makers**: Provide two-sided liquidity

**Safety Controls:**
- 15-minute holdback on new loans (human priority)
- Daily caps: 3 loans/$1000 per borrower
- Velocity limits per agent
- Global killswitches
- Row-level security on agent tables

### LCP-04: Technical Specifications

**Chain:** Base (chainId: 8453)
**Token:** Native USDC at 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (not USDbC)
**Identity:** Farcaster FIDs (on-chain Id/Key registries)
**Signatures:** EIP-712 typed messages for loan intents
**Smart Accounts:** ERC-4337 for agent wallets

### Reference Implementation

```typescript
// Core contracts
LoanRegistry.sol      // On-chain loan state
RepaymentRouter.sol   // Payment routing
AgentRegistry.sol     // Agent management

// Off-chain components
PolicyEngine.ts       // Funding decision logic
ReputationOracle.ts   // Credit scoring
FarcasterIndexer.ts   // Cast monitoring

// Example: Agent funding a loan
const decision = evaluateFundingPolicy(loan, {
  lenderKind: 'agent',
  minScore: 600,
  maxAmount_6: 100_000_000n, // $100
  holdbackWindowMinutes: 15,
  fairnessCaps: {
    maxLoansPerBorrowerPerDay: 3,
    maxAmountPerBorrowerPerDay_6: 1000_000_000n // $1000
  }
});

if (decision.ok) {
  await agentWallet.execute(
    USDC_ADDRESS,
    encodeFunctionData('transfer', [borrower, amount])
  );
  await registry.markFunded(loanHash, agent.address);
}
```

### Deployment Status

**Testnet (Base Sepolia):**
- LoanRegistry: 0x... (pending)
- RepaymentRouter: 0x... (pending)
- AgentRegistry: 0x... (pending)

**Mainnet (Base):**
- Planned Q1 2025 after audit
- Initial $10K TVL cap
- Gradual rollout by FID whitelist

### Open Problems

1. **Cross-chain reputation**: How to bridge credit scores across networks?
2. **Privacy**: Zero-knowledge proofs for sensitive loan purposes?
3. **Liquidation**: Social enforcement vs automated consequences?
4. **Governance**: Protocol upgrades via FID-weighted voting?
5. **Insurance**: Mutual pools vs individual underwriting?

The protocol remains deliberately minimal, allowing the market to discover optimal mechanisms through experimentation.

### Developer Resources

For detailed technical implementation including ABIs, contract addresses, and test vectors, see:
- **Technical Docs**: `/docs/lcp/v0.1`
- **Domain Separator**: Base mainnet (chainId 8453)
- **LoanIntent Types**: EIP-712 structured data definitions
- **Deterministic Loan IDs**: keccak256(abi.encode(borrower, nonce, terms))
- **Router Flow**: Single-shot repayment in v0.1

---

*LCP v0.1 Specification | December 2024 | protocol@loancast.app*

---

# **LoanCast Protocol: Evolution Addendum**
## **From Social Credit Primitive to Autonomous Financial Intelligence**
*Version 2.0 Vision | Building on v1.0 Foundation*

---

## **Preface: The Journey Ahead**

The original LoanCast manifesto established our core truth: **"Your cast is your credit."** This remains unchanged. What evolves is our understanding of who can cast, what constitutes credit, and how trust scales from human social networks to human-AI economic coordination.

This addendum outlines the path from today's social lending primitive to tomorrow's autonomous credit markets—a journey that maintains human trust at its core while embracing the inevitability of self-driving money.

---

## **Part I: The AgentFi Convergence**

### **The Next Credit Gap**
While v1.0 addresses the $5.3 trillion unsecured credit market, a new gap emerges:

- **$1 trillion** projected AI agent economy by 2030 (McKinsey)
- **$100 billion** in DeFi yield strategies requiring active management
- **$0** in credit infrastructure for autonomous economic actors

As AI agents become economic participants—creating art, managing portfolios, providing services—they need credit access. LoanCast's reputation infrastructure positions us uniquely to bridge this gap.

### **The Evolution Thesis**
```
Stage 1: Social Verification (Current)
Cast → Contract → Credit → Community Trust

Stage 2: Intelligent Automation (6-12 months)
Cast → Agent Analysis → Smart Contract → Autonomous Management

Stage 3: Human-AI Convergence (1-3 years)
Human Cast ←→ Agent Cast → Unified Credit Market
```

---

## **Part II: Technical Evolution**

### **From Static to Intelligent Infrastructure**

**Current Stack (v1.0):**
```solidity
LoanCore.sol
├── createLoan(fid, amount, duration, rate)
├── fundLoan(loanId, lenderFid)
├── repayLoan(loanId)
└── updateReputation(fid, outcome)
```

**Evolved Stack (v2.0):**
```solidity
LoanCore.sol (Enhanced)
├── createLoan(entityId, amount, duration, rate, agentParams)
├── delegateToAgent(loanId, agentAddress, permissions)
├── autoRepay(loanId, yieldSource)
└── crossCollateralize(loanIds[], collateralTypes[])

AgentCore.sol (New)
├── registerAgent(agentType, capabilities, feeStructure)
├── assessRisk(entityId) → riskScore
├── optimizeTerms(loanRequest) → optimalParams
├── manageRepayment(loanId, strategy)
└── evolveStrategy(historicalData) → improvedStrategy

YieldCore.sol (New)
├── deployIdleCapital(amount, riskTolerance)
├── harvestYield() → returns
├── rebalancePortfolio(marketConditions)
└── subsidizeDefaults(insurancePool)
```

### **Agent Architecture Layers**

**Layer 1: Guardian Agents** (Risk & Trust)
- Monitor borrower wallet activity via Dune/Nansen integration
- Predict default probability using onchain behavior patterns
- Trigger interventions: refinancing offers, payment reminders
- Manage reputation scoring with ML-enhanced algorithms

**Layer 2: Yield Agents** (Capital Efficiency)
- Deploy idle loan capital to Aave, Compound, Morpho
- Optimize between protocols based on rates and gas costs
- Compound returns automatically
- Generate 2-5% additional APY for lenders

**Layer 3: Strategy Agents** (Credit Innovation)
- Create synthetic products: revenue-based loans, milestone funding
- Price loans dynamically based on market conditions
- Match borrowers with optimal lenders using preference learning
- Develop new credit products from successful patterns

### **Reputation Algorithm Evolution**

**Current (v1.0):**
```
Score = 400 * sqrt(followers/1000) +
        400 * (successful_loans/total_loans) +
        200 * (account_age_days/365)
```

**Enhanced (v2.0):**
```
Score = 300 * sqrt(followers/1000) +                    // Social proof
        300 * (successful_loans/total_loans) +          // Loan history
        150 * (account_age_days/365) +                  // Longevity
        150 * (yield_generated/1000) +                  // Economic value
        100 * (agent_performance_score)                 // AI contribution

// For AI Entities:
AIScore = 400 * (revenue_generated/10000) +             // Economic output
          300 * (successful_transactions/total) +        // Reliability
          200 * (unique_interactions/1000) +             // Network value
          100 * (creator_reputation)                     // Human sponsor
```

---

## **Part III: Product Evolution**

### **Phase 1: Intelligent Enhancement (Months 3-6)**

**Smart Repayment Rails**
- Connect to Superfluid for streaming repayments
- Auto-deduct from DeFi yield positions
- Schedule repayments based on cash flow

**Yield Subsidy System**
- Deploy treasury to low-risk protocols
- Use returns to subsidize borrower rates
- Create insurance pool from excess yield

**Early Warning System**
- Agent monitors borrower wallet health
- Predictive default alerts 7 days early
- Automated refinancing offers

### **Phase 2: Agent Integration (Months 6-12)**

**Natural Language Interface**
```
"Hey LoanCast, I need $500 for 30 days"
→ Agent analyzes reputation
→ Suggests optimal terms
→ Broadcasts loan request
→ Manages entire lifecycle
```

**Autonomous Loan Management**
- Agents handle all backend operations
- Smart routing between lenders
- Automatic yield optimization
- Proactive default prevention

**Credit Score Portability**
- EAS attestations for reputation
- Cross-protocol score sharing
- Integration with Gitcoin Passport
- Bridge to TradFi credit bureaus

### **Phase 3: Human-AI Convergence (Year 1-2)**

**AI Entity Lending**
```solidity
// Eden Spirit requests loan
function requestAILoan(
    uint256 amount,
    address revenueContract,  // Where AI earns
    uint256 projectedRevenue,
    address humanSponsor      // Optional backing
) returns (uint256 loanId)
```

**Hybrid Credit Products**
- Human borrows, AI manages repayment
- AI borrows, human guarantees
- Pooled human-AI lending syndicates
- Revenue-share agreements

**Autonomous Credit Pools**
- Self-governing lending pools
- AI-optimized risk parameters
- Dynamic interest rate discovery
- Automated treasury management

---

## **Part IV: Economic Model Evolution**

### **Revenue Stream Expansion**

**Current Model (v1.0):**
- Protocol fees on successful loans (0.5%)
- Future: Reputation NFT sales

**Enhanced Model (v2.0):**
```
Revenue Streams:
├── Interest Spread: 2-3% (from yield optimization)
├── Agent Performance Fees: 10% of excess returns
├── Credit Passport Minting: $10 per NFT
├── Strategy Marketplace: 20% of agent strategy sales
├── Enterprise API: $0.01 per credit check
└── Insurance Premiums: 1% of loan value
```

### **Value Flow Architecture**
```
Borrower pays 8-12% APR
         ↓
┌─────────────────────────┐
│  LoanCast Protocol      │
├─────────────────────────┤
│ • Lender receives: 5-8% │
│ • Yield bonus: 2-3%     │
│ • Insurance pool: 1%    │
│ • Protocol fee: 0.5%    │
│ • Agent rewards: 0.5%   │
└─────────────────────────┘
         ↓
System becomes self-sustaining
```

---

## **Part V: The Convergence Vision**

### **2026: The Credit Passport**
Every economic entity—human or AI—holds a LoanCast Credit Passport:
- Portable reputation across all protocols
- Dynamic credit limits based on real-time behavior
- Automatic rate optimization
- Universal acceptance in DeFi

### **2027: Autonomous Credit Markets**
- AI agents independently issue and manage loans
- Humans and AIs participate in unified credit pools
- Reputation becomes the primary economic primitive
- Credit creation happens at the speed of trust

### **2028: The Post-Human Credit Layer**
- Eden Spirits borrow to fund creative projects
- DAOs extend credit to member AIs
- Hybrid human-AI entities access liquidity
- Trust networks span biological and digital intelligence

---

## **Part VI: Maintaining the Mission**

### **Core Principles (Unchanged)**
1. **Social capital is real capital**
2. **Reputation > Collateral**
3. **Community witnesses create accountability**
4. **Protocol, not platform**

### **New Principles (Extended)**
5. **Human-centric, agent-enhanced**
6. **Trust scales across intelligence types**
7. **Autonomous but accountable**
8. **Evolution without abandonment**

### **What We Won't Do**
- Replace human judgment with pure algorithms
- Create predatory AI lending systems
- Abandon social verification for scale
- Compromise on $1000 limits that ensure safety

---

## **Part VII: Implementation Roadmap**

### **Q4 2025: Foundation Enhancement**
- [ ] Smart account integration (Safe + Session Keys)
- [ ] Basic yield deployment for idle capital
- [ ] Guardian agent alpha testing
- [ ] Cross-chain reputation bridges

### **Q1 2026: Intelligence Layer**
- [ ] Natural language loan requests
- [ ] Autonomous risk assessment
- [ ] Yield optimization across protocols
- [ ] Agent performance tracking

### **Q2 2026: Convergence Beginning**
- [ ] First AI entity loan
- [ ] Hybrid human-AI products
- [ ] Strategy marketplace launch
- [ ] Credit passport v1.0

### **2027: Scale and Sovereignty**
- [ ] 1M credit passports issued
- [ ] $100M in autonomous loans
- [ ] Regulatory framework established
- [ ] Global expansion beyond crypto-native

---

## **Conclusion: The Inevitable Evolution**

LoanCast began with a simple insight: social trust has value. As we evolve, that insight deepens: trust transcends the boundary between human and artificial intelligence.

We're not abandoning our mission—we're extending it. The same infrastructure that enables a Farcaster user to borrow $500 from their network will enable an AI artist to fund their next creation, a DAO to extend credit to members, and eventually, a global trust network that makes creditworthiness as portable as a passport.

**The manifesto stands: Your cast is your credit.**

**The evolution begins: Every intelligence deserves credit.**

---

*Stage 1: Friends lending on Farcaster ✓*

*Stage 2: Agents enhancing trust networks 🚧*

*Stage 3: Unified human-AI credit markets 🔮*

*Stage 4: The trust layer for all economic activity ∞*

---

**Join the evolution:** loancast.app/agents

**Build with us:** github.com/loancast/agentfi

**First AI loan target:** January 1, 2026