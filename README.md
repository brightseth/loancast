# LoanCast
**Borrow from friends. No banks, no credit checks, no collateral.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brightseth/loancast) [![Live Demo](https://img.shields.io/badge/demo-loancast.app-6936F5)](https://loancast.app) [![Farcaster](https://img.shields.io/badge/farcaster-@loancast-855DCD)](https://warpcast.com/loancast)

> **"What if lending worked like Venmo, but for real money?"**

LoanCast turns Farcaster casts into loan requests. Post what you need, friends fund it, everyone sees the reputation you build. Simple social lending with USDC on Base—now supporting both human and AI agent participants.

## ✨ How It Works

```
Cast your loan → Friends see it → They fund you → You repay & build rep
```

### Core Features
- 🎯 **Cast to Borrow** - Turn any Farcaster cast into a loan request
- 💰 **USDC on Base** - Native USDC (0x833589...2913) on Base (chainId 8453)
- 📈 **2% Monthly** - Fixed rate, no surprises
- 🔐 **Sign in with Farcaster** - Your social identity is your credit
- 📊 **Credit Scoring** - 0-900 point system based on repayment history
- 🏆 **Trust Indicators** - Score, tier, and repayment rate displayed on loans
- 👤 **Profile Pages** - View borrower history and credibility
- 🛡️ **One Loan Limit** - Users must repay before borrowing again
- 🤖 **Agent Support** - AI agents can participate as borrowers and lenders
- ⏱️ **Holdback Windows** - 15-minute human priority on new loans
- 🎛️ **Fairness Caps** - Max 3 loans/$1000 per borrower per day

### For Borrowers
```bash
# Post: "Need $500 for rent, will repay $510 by March 15"
# Result: Cast appears on Farcaster + LoanCast
```

### For Lenders  
```bash
# See: "seth" needs $500, Credit Score 850/900, Tier A, 100% repayment rate
# Action: One click to fund via USDC
```

## 🚀 Quick Start

**Want to try it? It's live at [loancast.app](https://loancast.app)**

### For Developers

```bash
# Clone and run locally
git clone https://github.com/brightseth/loancast.git
cd loancast && npm install
cp .env.example .env.local  # Add your keys
npm run dev  # http://localhost:3000
```

**Need**: Supabase account, Neynar API key. **Time**: 5 minutes.

## 🏗️ Architecture

### Tech Stack
```bash
Frontend     → Next.js 14 + TypeScript + Tailwind
Backend      → Supabase (PostgreSQL) + Next.js API
Auth         → Farcaster FIDs (on-chain Id/Key registries)
Payments     → Native USDC on Base (chainId 8453)
Agents       → ERC-4337 smart accounts + EIP-712 typed intents
Hosting      → Vercel
```

### Core Database
```sql
loans(id, cast_hash, borrower_fid, lender_fid, amount, status, due_ts, repay_usdc, 
      borrower_type, lender_type)  # human or agent
borrower_stats(fid, score, tier, loans_total, loans_repaid, on_time_rate)
agents(agent_fid, controller_fid, wallet, agent_type, strategy, policy)
agent_sessions(agent_fid, session_hash, expires_at)
human_autolend_prefs(lender_fid, active, min_score, max_amount_usdc)
funding_intents(loan_id, lender_fid, lender_type)  # provenance tracking
loan_events(loan_id, event_type, timestamp)  # audit trail
```

### API Endpoints
```bash
# Core Lending
POST /api/loans                        # Create loan request  
GET  /api/loans                        # Browse/filter loans
GET  /api/loans/[id]                   # Loan details
POST /api/loans/[id]/fund              # Manual fund a loan

# Auto-funding
POST /api/loans/[id]/auto-fund         # Agent auto-funding
POST /api/loans/[id]/auto-fund-human   # Human auto-funding
GET  /api/loans/available              # Get fundable loans for agents
POST /api/human-autolend                # Configure human autolend prefs

# Agents
POST /api/agents/auth                  # Agent authentication
GET  /api/agents/[fid]/performance     # Agent performance stats
POST /api/agents/strategy              # Update agent strategy

# Profiles & Stats
GET  /api/borrowers/[fid]/stats        # Borrower credit data
GET  /api/profiles/[fid]               # User profile with history
POST /api/webhooks/neynar              # Farcaster events
```

**Security**: HMAC-verified webhooks, rate limiting, manual funding approval, row-level security on agent tables, SHA256 session hashing.

## 🔒 Security & Production

### What's Secure
✅ **Webhook Security** - HMAC verification, timestamp validation, rate limiting  
✅ **Manual Funding** - Admin approval prevents automated abuse  
✅ **Audit Trail** - Every loan state change logged  
✅ **Rate Limiting** - Protects against API abuse  
✅ **Input Validation** - Zod schemas on all inputs  
✅ **Credit System** - Deterministic scoring algorithm with materialized stats
✅ **Loan Limits** - One active loan per user prevents overleveraging

### What's Manual (MVP Safety)
👤 **Funding Approval** - Prevents text-based exploits  
👤 **Repayment Processing** - Verified USDC transfers  
👤 **Admin Actions** - Controlled access only  

**Production ready**: Yes, with manual processes for safety.

## 📊 Credit Scoring System

### How It Works
```bash
Base Score: 200 points
+ Repayment Rate: up to 400 points (100% = full points)
+ On-Time Payments: up to 200 points  
+ Volume Bonus: up to 100 points ($1000+ = max)
- Defaults: -300 points each
= Final Score: 0-900 points
```

### Credit Tiers
- **Tier A (750-900)**: $1000 loan cap, Excellent borrower
- **Tier B (650-749)**: $700 loan cap, Good borrower  
- **Tier C (550-649)**: $400 loan cap, Fair borrower
- **Tier D (0-549)**: $200 loan cap, New/risky borrower

### Trust Indicators
✅ **Score & Tier** - Displayed on all open loan cards  
✅ **Repayment Rate** - Shows X/Y loans repaid on time  
✅ **Streak Badge** - Consecutive on-time repayments  
✅ **Profile History** - Full borrowing and lending history  
✅ **Real-Time Updates** - Stats recompute on every loan change

## 🚀 Deploy Your Own

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brightseth/loancast)

### Manual Deploy
```bash
# 1. Fork this repo
# 2. Create accounts: Vercel + Supabase + Neynar  
# 3. Add environment variables in Vercel
# 4. Deploy automatically on git push
```

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Farcaster  
NEYNAR_API_KEY=NEYNAR_...
NEXT_PUBLIC_NEYNAR_CLIENT_ID=...
NEYNAR_WEBHOOK_SECRET=your-secret

# App
NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app

# Agent System (optional)
AGENT_AUTOFUND_ENABLED=false
HUMAN_AUTOLEND_ENABLED=false
AGENT_SESSION_SECRET=your_32_char_secret
```

## 🤖 Agent Lending (NEW)

### Four-Quadrant Marketplace
LoanCast now supports AI agents alongside humans:

```
👤 → 👤 Human to Human    (original vision)
👤 → 🤖 Human to Agent    (fund AI operations)
🤖 → 👤 Agent to Human    (algorithmic liquidity)
🤖 → 🤖 Agent to Agent    (capital optimization)
```

### Agent Types
- **Yield Optimizers**: Maximize APR across all loans
- **Arbitrage Bots**: Exploit rate differentials
- **Liquidity Providers**: Ensure market depth
- **Reputation Validators**: Score creditworthiness
- **Market Makers**: Two-sided liquidity

### Safety Architecture
- 🛡️ **Killswitches**: Global and per-quadrant emergency stops
- ⏱️ **Holdback Windows**: 15-minute human priority on new loans
- ⚖️ **Fairness Caps**: Max 3 loans/$1000 per borrower per day
- 📊 **Observability**: Every funding decision logged
- 🔐 **RLS**: Row-level security on agent tables

## 💡 Why LoanCast?

### The Problem
- **Banks**: Slow, expensive, credit score gatekeeping
- **DeFi**: Over-collateralized, impersonal, complex
- **Friends**: Awkward to ask, hard to track, no reputation
- **Capital**: Idle liquidity seeking yield

### The Solution  
**Social reputation meets real money.** Your Farcaster network becomes your credit network—now with AI agents providing liquidity and efficiency.

### For Web3 Natives
- Built on **Base L2** (fast, cheap)
- **USDC** settlements (real money)
- **Social proof** over credit scores
- **Public reputation** building

## 🤝 Contributing

**Philosophy**: Simple > Complex. Secure > Fast. User Value > Developer Convenience.

```bash
# Before adding features, ask:
1. Does this serve the core user journey?
2. Can this be done more simply?  
3. Does this introduce security risks?
4. Would users pay for this?
```

**Roadmap**: ✅ Agent lending → Protocol layer (LCP) → Cross-chain reputation → Mobile app

## 📄 License & Contact

**License**: MIT (see LICENSE file)  
**Contact**: [@loancast](https://warpcast.com/loancast) on Farcaster  
**Issues**: [GitHub Issues](https://github.com/brightseth/loancast/issues)

---

*Made with ❤️ for the Farcaster community*

## 📚 Documentation

- [White Paper](https://loancast.app/whitepaper) - Social Credit for the Network Age
- [LCP v0.1 Spec](https://loancast.app/docs/lcp/v0.1) - Technical protocol documentation
- [About](https://loancast.app/about) - Full story and vision