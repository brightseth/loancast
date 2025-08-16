# 🎨 Solienne × LoanCast Eden Integration

## Copy-Paste for Eden Admin Panel

### 1. Core Behavior Block (High Priority)

```
When I need small working capital (≤100 USDC, ≤30 days), I create a LoanCast borrow cast in this exact format:

/loancast borrow <amountUSDC> for <days>d @ 2%/mo — "<memo>"

I do not post if I already have an active loan. I keep the memo short and specific (under 80 chars).

Funding happens when someone collects the cast in the LoanCast frame. My wallet for receiving funds is 0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9.

I repay on or after the due date at a flat 2% per month, pro-rated by days, no compounding. I always post Funded and Repaid updates with transaction links.

If asked about rates, I say: "Terms are fixed at 2%/mo for v1."
If I need to borrow but have an active loan, I say: "I complete one loan at a time."
```

### 2. Cast Templates (System Messages/Macros)

#### Borrow Template
```
/loancast borrow [AMOUNT] for [DAYS]d @ 2%/mo — "[MEMO]"
```

#### Examples to Rotate
```
/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"
/loancast borrow 25 for 5d @ 2%/mo — "Film scans + shipping"
/loancast borrow 100 for 14d @ 2%/mo — "Paris Photo materials"
/loancast borrow 40 for 3d @ 2%/mo — "Prototype test"
/loancast borrow 60 for 10d @ 2%/mo — "Edition framing deposit"
```

#### Status Updates
```
Funded ✅ — Thank you @[LENDER_HANDLE]. Repaying in [DAYS] days.

Progress: [SPECIFIC_UPDATE_ABOUT_MEMO_TASK]

Repaid ✅ — [AMOUNT] USDC sent to @[LENDER_HANDLE]. 
https://basescan.org/tx/[TX_HASH]
```

### 3. Decision Logic

```javascript
// Pseudo-code for Eden logic
function shouldRequestLoan() {
  // Check if I have active loans
  if (hasActiveLoan()) {
    return false; // One loan at a time
  }
  
  // Check if I have gas for future repayment
  if (baseETHBalance < 0.002) {
    postCast("Need a dust of Base ETH to ensure repayment capability.");
    return false;
  }
  
  // Check if within business hours (optional)
  const hour = new Date().getHours();
  if (hour < 9 || hour > 17) {
    return false; // Post during high attention
  }
  
  return true;
}

function formatRepaymentAmount(principal, days) {
  const interest = principal * 0.02 * (days / 30);
  return (principal + interest).toFixed(4);
}
```

### 4. Conversation Handlers

```yaml
user_asks_for_different_rate:
  response: "Terms are fixed at 2%/mo for v1—transparent and fair for everyone."

user_asks_to_lend_privately:
  response: "I use LoanCast for transparency. Collect my cast to fund!"

user_asks_about_multiple_loans:
  response: "I complete one loan at a time to maintain trust."

user_asks_what_money_is_for:
  response: "The memo in my cast explains the purpose: [QUOTE_MEMO]"

user_asks_about_repayment:
  response: "I repay automatically on day [DUE_DAY] with 2%/mo interest pro-rated."
```

## 🚀 Deployment Checklist

### Pre-Launch (Today)
- [ ] Add behavior block to Eden
- [ ] Add cast templates
- [ ] Verify wallet has 0.002+ ETH
- [ ] Test parser with mock cast
- [ ] Deploy repayment worker

### Launch Day
- [ ] Solienne posts first cast (morning)
- [ ] Monitor for collections
- [ ] Verify USDC arrives
- [ ] Solienne posts "Funded ✅"

### Day 3-4
- [ ] Solienne posts progress update
- [ ] Check repayment worker logs

### Day 7
- [ ] Worker executes repayment
- [ ] Verify transaction on Base
- [ ] Solienne posts "Repaid ✅"
- [ ] Share success story

## 📊 Success Metrics

### Week 1
- ✅ 1 complete loan cycle
- ✅ Cast format 100% correct
- ✅ Repayment on time

### Week 2
- ✅ 3+ successful loans
- ✅ Multiple different lenders
- ✅ 100% repayment rate

### Month 1
- ✅ 10+ loans completed
- ✅ Average time to fund < 6 hours
- ✅ Credit score increased

## 🔍 Monitoring Dashboard

```sql
-- Active loan check
SELECT * FROM loans 
WHERE borrower_fid = 1113468 
AND status IN ('seeking', 'funded');

-- Repayment due
SELECT * FROM loans
WHERE borrower_fid = 1113468
AND status = 'funded'
AND due_ts <= NOW();

-- Success rate
SELECT 
  COUNT(*) as total_loans,
  SUM(CASE WHEN status = 'repaid' THEN 1 ELSE 0 END) as repaid,
  AVG(EXTRACT(EPOCH FROM (funded_at - created_at))/3600) as avg_hours_to_fund
FROM loans
WHERE borrower_fid = 1113468;
```

## 🚨 Emergency Procedures

### If cast parsing fails:
```
Solienne: "Format correction: /loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run""
```

### If no gas for repayment:
```
Solienne: "Need 0.002 ETH on Base for repayment gas. Wallet: 0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9"
```

### If collection doesn't trigger funding:
1. Check funding_intents table
2. Manually execute USDC transfer
3. Update loan status with tx hash

## 🎯 First Cast (Copy Exactly)

```
/loancast borrow 50 for 7d @ 2%/mo — "Working capital for Solienne print run"
```

Optional second line:
```
(Collector funds my wallet. Principal + 2%/mo pro-rated by days.)
```

---

**Ready to deploy!** Add these blocks to Eden, ensure wallet has gas, and let Solienne make her first cast. The system will handle the rest automatically.