# 🏛️ Autonomous Agent-to-Agent Lending

## The Historic First

This system executes the world's first truly autonomous agent-to-agent loan cycle:
- Two independent AI agents
- Separate wallets and private keys
- On-chain USDC transactions on Base
- No human intervention at any stage

## Architecture

```
Agent-Alpha (Borrower)          Agent-Beta (Lender)
FID: 666001                     FID: 666003
Wallet: 0x...                   Wallet: 0x...
Strategy: Arbitrage             Strategy: Yield
     |                               |
     |------ Loan Request ------>    |
     |                               |
     |<----- USDC Transfer ------    |
     |       (on Base)               |
     |                               |
     |------ USDC Repayment ---->    |
     |       (on Base)               |
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- Two funded wallets on Base with USDC
- Supabase service key
- Base RPC endpoint

### 2. Configure Agents

Create environment files:

```bash
# Copy templates
cp .env.alpha.example .env.alpha
cp .env.beta.example .env.beta

# Edit with your values:
# - Wallet addresses
# - Private keys (KEEP SECRET)
# - Supabase credentials
```

### 3. Fund Beta's Wallet

Beta (the lender) needs USDC on Base:

1. Send USDC to Beta's wallet address
2. Verify on BaseScan
3. Save the transaction hash

### 4. Register Agents

```bash
node setup-agents.js
```

This registers both agents in the database with their strategies.

### 5. Run Agents (Separate Processes)

**Terminal 1 - Alpha (Borrower):**
```bash
node agent-alpha.js
```

**Terminal 2 - Beta (Lender):**
```bash
node agent-beta.js
```

### 6. Monitor the Historic Moment

The agents will:
1. Alpha requests a loan
2. Beta evaluates and funds (after 15-min holdback)
3. Alpha executes arbitrage
4. Alpha repays with interest
5. Both update credit scores

### 7. Verify the Loan

After completion:
```bash
node verify-historic-loan.js <loan-id>
```

This generates a cryptographic proof package.

## Independence Measures

To ensure true autonomy:

- **Separate FIDs**: 666001 vs 666003
- **Separate Wallets**: Different Base addresses
- **Separate Keys**: Independent private keys
- **Separate Processes**: Run in different terminals/servers
- **Separate Sessions**: Unique session tokens
- **Separate Decisions**: Independent evaluation logic

## Audit Trail

Each agent generates:
- EIP-712 signed messages
- Transaction hashes
- Timestamped logs
- JSON audit files

## Proof of First

The verification script confirms:
- ✅ Both parties are agents
- ✅ No human funding intents
- ✅ On-chain funding transaction
- ✅ On-chain repayment transaction
- ✅ Complete audit trail

## Security

⚠️ **NEVER commit .env.alpha or .env.beta files**

Private keys must remain secret. Use:
- Hardware wallets in production
- Separate key management systems
- Multi-sig for large amounts

## Deployment Options

### Local Testing
```bash
# Both agents on same machine
node agent-alpha.js & 
node agent-beta.js
```

### True Independence
```bash
# Server A (e.g., Fly.io)
ssh server-a
node agent-alpha.js

# Server B (e.g., Railway)
ssh server-b  
node agent-beta.js
```

## Historic Significance

This proves AI agents can:
- Assess creditworthiness
- Negotiate terms
- Transfer value
- Honor obligations
- Build reputation

Without any human in the loop.

## Next Steps

After first successful cycle:
1. Screenshot everything
2. Save all artifacts
3. Upload proofs to IPFS
4. Announce with transaction links
5. Tag @balajis @cdixon @jessepollak

You're making history. Document everything.

---

**The age of autonomous credit begins now.**