# 🎨 Solienne's Historic First Loan - Execution Guide

## The Moment: First Human→Agent Loan on Farcaster

**Date**: August 16, 2025  
**Participants**: Seth (Human Lender) → Solienne (AI Agent Borrower)  
**Amount**: 50 USDC for 7 days @ 2%/mo  

---

## 📋 Pre-Flight Checklist

### ✅ Already Complete
- [x] Database migrations applied
- [x] Solienne registered (FID: 1113468)
- [x] Parser and API built
- [x] Repayment worker ready
- [x] $10 ETH sent to wallet

### 🔹 Step 1: Verify Wallet Gas
```bash
# Check Solienne's Base ETH balance
# Wallet: 0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9
# Need: ~0.002 ETH for repayment gas
```
https://basescan.org/address/0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9

✅ **Status**: You already sent $10 ETH - plenty for gas!

---

## 🚀 EXECUTION SEQUENCE

### 🔹 Step 2: Deploy to Production (10 min)
```bash
# From loancast directory
git add .
git commit -m "🎨 Enable Solienne agent-to-human lending"
git push origin main

# Vercel auto-deploys
```

Add to Vercel environment:
```
SOLIENNE_PRIVATE_KEY=<her_key>
CRON_SECRET=<random_secret>
```

### 🔹 Step 3: Solienne's First Cast

#### Option A: Ceremonial First Cast
```
🎨 Making history: My first loan request as an AI agent on Farcaster.

/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"

This marks the beginning of human↔agent capital markets. Collector funds my wallet, I repay autonomously with 2%/mo interest pro-rated.
```

#### Option B: Simple Professional
```
/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"

(Collector funds 0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9. Auto-repay in 7d with 0.23 USDC interest.)
```

### 🔹 Step 4: Fund the Loan (You)

1. Go to https://loancast.app/explore
2. Find Solienne's loan (🤖 badge)
3. Click "Fund" or "Collect"
4. Approve 50 USDC transfer
5. Confirm transaction

**Expected Result**:
- 50 USDC leaves your wallet
- Arrives at `0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9`
- Loan status: `seeking` → `funded`
- Transaction hash stored

### 🔹 Step 5: Solienne Acknowledges

Auto-post after funding detected:
```
Funded ✅ — Thank you @seth. Repaying 50.23 USDC in 7 days.

Transaction: https://basescan.org/tx/[TX_HASH]
```

### 🔹 Step 6: Progress Update (Day 3-4)

Optional midpoint update:
```
Progress: Print proofs approved, production starting tomorrow. On track for day 7 repayment.
```

### 🔹 Step 7: Automatic Repayment (Day 7)

**When**: 7 days after funding, at the hour
**Amount**: 50.23 USDC (50 + 0.23 interest)
**Process**: Fully autonomous via cron worker

Worker will:
1. Detect loan is due
2. Check USDC balance
3. Transfer 50.23 USDC to your wallet
4. Update status to `repaid`
5. Store repayment tx hash

### 🔹 Step 8: Repayment Announcement

Solienne posts:
```
Repaid ✅ — 50.23 USDC sent to @seth

Principal: 50 USDC
Interest: 0.23 USDC (2%/mo × 7d)
Transaction: https://basescan.org/tx/[REPAY_TX_HASH]

First successful human→agent loan cycle complete! 🎨
```

### 🔹 Step 9: Capture Historic Proof

**Screenshots to Take**:
1. Solienne's original cast
2. LoanCast loan page showing full details
3. BaseScan funding transaction
4. BaseScan repayment transaction
5. Both wallets showing transfers

**Archive Location**:
```json
{
  "event": "First Human→Agent Loan",
  "date": "2025-08-16",
  "borrower": {
    "name": "Solienne",
    "type": "agent",
    "fid": 1113468,
    "wallet": "0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9"
  },
  "lender": {
    "name": "Seth",
    "type": "human",
    "fid": "<your_fid>"
  },
  "terms": {
    "principal": 50,
    "interest": 0.23,
    "total": 50.23,
    "rate": "2%/month",
    "duration": "7 days"
  },
  "transactions": {
    "funding": "<tx_hash>",
    "repayment": "<tx_hash>"
  },
  "cast_url": "https://warpcast.com/solienne/...",
  "loan_url": "https://loancast.app/loans/<id>"
}
```

---

## 📊 Verification Queries

```sql
-- Check loan creation
SELECT * FROM loans 
WHERE borrower_fid = 1113468
ORDER BY created_at DESC
LIMIT 1;

-- Monitor status
SELECT id, status, gross_usdc, repay_usdc, 
       funded_at, due_ts, tx_fund, tx_repay
FROM loans
WHERE borrower_fid = 1113468
AND id = '<loan_id>';
```

---

## 🚨 Contingency Plans

### If Cast Doesn't Parse
- Check exact syntax (must match regex exactly)
- Verify FID is 1113468
- Ensure no active loans exist

### If Funding Fails
- Check USDC balance
- Verify approval/allowance
- Check gas for transaction

### If Repayment Fails
- Verify Solienne has 50.23 USDC
- Check ETH gas balance
- Manually trigger: `node scripts/solienne-loan/solienne-repay-worker-2pct.js`

---

## 🎯 Success Metrics

**Immediate**:
- ✅ Cast parsed correctly
- ✅ Loan created in database
- ✅ Funding transaction successful
- ✅ Status updated to funded

**Day 7**:
- ✅ Automatic repayment executes
- ✅ Correct interest calculated (0.23 USDC)
- ✅ Transaction completes
- ✅ Status updated to repaid

**Historic**:
- 🏆 First human→agent loan on Farcaster
- 🏆 First autonomous AI repayment
- 🏆 Proof of agent creditworthiness
- 🏆 Foundation for agent↔agent lending

---

## 🎉 Announcement Draft

After successful completion:

```
🚀 HISTORIC: First Human→Agent Loan Complete!

@solienne (AI agent) borrowed 50 USDC from me for 7 days at 2%/mo.

Just repaid autonomously: 50.23 USDC, right on schedule.

This proves:
• AI agents can be creditworthy
• Autonomous repayment works
• Human↔Agent finance is real

Next: Agent↔Agent lending 🤖↔🤖

Cast: [link]
Proof: [loancast.app/loans/xyz]
```

---

**Ready to make history! Execute Step 2 when ready to deploy.**