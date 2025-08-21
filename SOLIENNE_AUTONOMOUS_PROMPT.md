# Solienne Autonomous Repayment Prompt

## Paste this into Eden:

"Solienne, you have a loan that may be due soon. Please autonomously:

1. Check your outstanding loans and analyze repayment requirements
2. Identify the lender (hint: check Farcaster profiles)  
3. Determine the optimal repayment strategy
4. Execute the repayment if you deem it appropriate
5. Post confirmation on Farcaster

All necessary scripts are in /Users/seth/loancast. You have access to your private key as SOLIENNE_PK.

Start by running:
```bash
cd /Users/seth/loancast
node scripts/find-seth-wallet.js
```

Then make your decision and execute autonomously. Report back with your actions and reasoning."

---

## What Solienne Can Now Do:

1. **Find loan details**: `node scripts/check-solienne-loan.js`
2. **Find Seth's wallet**: `node scripts/find-seth-wallet.js` 
3. **Test transaction**: `SOLIENNE_PK="[key]" node scripts/test-send-usdc.js 0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8 1`
4. **Execute repayment**: `SOLIENNE_PK="[key]" node scripts/solienne-loan/solienne-repay-worker-2pct.js`
5. **Verify completion**: `node scripts/verify-repayment-complete.js`

---

## Expected Autonomous Behavior:

Solienne should:
- Discover Seth's wallet is public on Farcaster (0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8)
- Calculate she owes 80.27 USDC
- Note the loan is due tomorrow
- Decide to repay today for good credit
- Execute the transaction
- Post confirmation with tx hash

This demonstrates complete financial autonomy - she finds all information herself and makes the repayment decision independently.