# LoanCast
**Borrow from friends. No banks, no credit checks, no collateral.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brightseth/loancast) [![Live Demo](https://img.shields.io/badge/demo-loancast.app-6936F5)](https://loancast.app) [![Farcaster](https://img.shields.io/badge/farcaster-@loancast-855DCD)](https://warpcast.com/loancast)

> **"What if lending worked like Venmo, but for real money?"**

LoanCast turns Farcaster casts into loan requests. Post what you need, friends fund it, everyone sees the reputation you build. Simple social lending with USDC on Base.

## ✨ How It Works

```
Cast your loan → Friends see it → They fund you → You repay & build rep
```

### Core Features
- 🎯 **Cast to Borrow** - Turn any Farcaster cast into a loan request
- 💰 **USDC on Base** - Real money, low fees, fast settlement
- 📈 **2% Monthly** - Fixed rate, no surprises
- 🔐 **Sign in with Farcaster** - Your social identity is your credit
- 📊 **Public Reputation** - Every repayment builds your score

### For Borrowers
```bash
# Post: "Need $500 for rent, will repay $510 by March 15"
# Result: Cast appears on Farcaster + LoanCast
```

### For Lenders  
```bash
# See: Friend needs $500, has repaid 8/8 previous loans
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
Auth         → Farcaster via Neynar
Payments     → USDC on Base L2
Hosting      → Vercel
```

### Core Database
```sql
loans(id, cast_hash, borrower_fid, lender_fid, amount, status)
users(fid, username, reputation_score)  
loan_events(loan_id, event_type, timestamp)  # audit trail
```

### API Endpoints (21 total)
```bash
POST /api/loans              # Create loan request  
GET  /api/loans              # Browse/filter loans
GET  /api/loans/[id]         # Loan details
POST /api/loans/[id]/fund    # Fund a loan
POST /api/webhooks/neynar    # Farcaster events
```

**Security**: HMAC-verified webhooks, rate limiting, manual funding approval.

## 🔒 Security & Production

### What's Secure
✅ **Webhook Security** - HMAC verification, timestamp validation, rate limiting  
✅ **Manual Funding** - Admin approval prevents automated abuse  
✅ **Audit Trail** - Every loan state change logged  
✅ **Rate Limiting** - Protects against API abuse  
✅ **Input Validation** - Zod schemas on all inputs  

### What's Manual (MVP Safety)
👤 **Funding Approval** - Prevents text-based exploits  
👤 **Repayment Processing** - Verified USDC transfers  
👤 **Admin Actions** - Controlled access only  

**Production ready**: Yes, with manual processes for safety.

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
```

## 💡 Why LoanCast?

### The Problem
- **Banks**: Slow, expensive, credit score gatekeeping
- **DeFi**: Over-collateralized, impersonal, complex
- **Friends**: Awkward to ask, hard to track, no reputation

### The Solution  
**Social reputation meets real money.** Your Farcaster network becomes your credit network.

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

**Roadmap**: Automated funding → Advanced reputation → Mobile app

## 📄 License & Contact

**License**: MIT (see LICENSE file)  
**Contact**: [@loancast](https://warpcast.com/loancast) on Farcaster  
**Issues**: [GitHub Issues](https://github.com/brightseth/loancast/issues)

---

*Made with ❤️ for the Farcaster community*