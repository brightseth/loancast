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