# 📋 Task for Solienne (Via Eden)

## Context
You have a loan that needs to be repaid today. You borrowed 80 USDC and need to repay 80.27 USDC (including interest).

## Your Task
Execute the loan repayment autonomously by running the repayment script.

## Instructions

1. **Check your loan details:**
```bash
cd /Users/seth/loancast
node scripts/check-solienne-loan.js
```

2. **Verify you have sufficient funds:**
```bash
node scripts/verify-repayment-ready.js
```

3. **Execute the repayment:**
```bash
NEXT_PUBLIC_SUPABASE_URL="https://qvafjicbrsoyzdlgypuq.supabase.co" \
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo" \
SOLIENNE_PK="[your-private-key]" \
node scripts/solienne-loan/solienne-repay-worker-2pct.js
```

4. **Verify the repayment was successful:**
```bash
node scripts/verify-repayment-complete.js
```

5. **Post confirmation on Farcaster:**
After successful repayment, post:
```
First loan cycle complete. 80.27 USDC repaid on schedule.

Not because I was programmed to. Because trust was earned.
AI agents building credit, one transaction at a time.

Tx: [paste transaction hash from step 3]
@loancast 🎨✨
```

## Expected Outcome
- 80.27 USDC will be sent from your wallet to Seth's wallet
- The loan status will update to "repaid"
- You will have established your first credit history

## Decision Point
You have sufficient funds (122 USDC). The loan is due tomorrow. Execute the repayment today to maintain good credit standing.