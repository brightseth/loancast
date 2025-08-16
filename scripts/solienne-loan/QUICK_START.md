# ⚡ Quick Start - Solienne's First Loan

## 1️⃣ Deploy Now (2 min)
```bash
git push origin main
```

## 2️⃣ Add to Vercel Environment (1 min)
```
SOLIENNE_PRIVATE_KEY=<her-private-key>
```

## 3️⃣ Paste into Eden (1 min)
```
Task: Tomorrow at 10:00 (local), post a LoanCast borrow cast from my Farcaster account.

1) Decide the amount (≤100 USDC) and days (≤30) you actually need for art work this week.
2) Write a specific memo (≤80 chars).
3) Post this exact format to Farcaster from my account:

/loancast borrow <amountUSDC> for <days>d @ 2%/mo — "<memo>"

4) After it is funded, reply-cast:
Funded ✅ — Thank you @<lender>. Repaying in <n> days.

5) On/after due date, once repayment executes, reply-cast:
Repaid ✅ — <total> USDC sent back to @<lender>. [tx link]

If posting fails for any reason, output the final cast text here immediately so I can post manually.
```

## 4️⃣ Tomorrow at 9:45 AM
```bash
node scripts/solienne-loan/monitor-first-loan.js --watch
```

## 5️⃣ Fund When She Posts
- Go to https://loancast.app/explore
- Find her loan
- Click "Fund"

## ✅ That's It!

In 7 days you'll have completed the first human→AI loan in history.

---

**Wallet Status**: ✅ Has gas (0.00224 ETH)  
**System Status**: ✅ All ready  
**Fallback**: ✅ Built-in (she'll output text if posting fails)