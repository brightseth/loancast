# 🔴 SOLIENNE LOAN REPAYMENT - EXECUTE TODAY

## 📊 Quick Summary
- **Amount Due**: 80.27 USDC
- **Due Date**: Thursday, Aug 21 (tomorrow)
- **Solienne's Wallet**: `0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9`
- **Your Wallet (Seth)**: Will receive the repayment

---

## ✅ STEP 1: Send USDC to Solienne (Do This First)

1. **Check Solienne's current USDC balance:**
   ```bash
   open "https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913?a=0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9"
   ```

2. **Calculate how much to send:**
   - She needs: 80.27 USDC total
   - Current balance: [check on Basescan]
   - **Send: 81 USDC** (a bit extra for safety)

3. **Send USDC on Base network:**
   - To: `0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9`
   - Amount: 81 USDC
   - Network: Base

---

## ✅ STEP 2: Verify Balances

Run this script to confirm everything is ready:

```bash
node scripts/verify-repayment-ready.js
```

This will check:
- ✓ Solienne has enough USDC (80.27+)
- ✓ Solienne has enough ETH for gas
- ✓ Loan details are correct

---

## ✅ STEP 3: Execute Repayment

Once balances are confirmed, run the repayment:

```bash
# Set Solienne's private key
export SOLIENNE_PK="[her-private-key-here]"

# Run the repayment
NEXT_PUBLIC_SUPABASE_URL="https://qvafjicbrsoyzdlgypuq.supabase.co" \
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo" \
node scripts/solienne-loan/solienne-repay-worker-2pct.js
```

---

## ✅ STEP 4: Verify Success

After repayment completes:

```bash
# Check the transaction on Basescan
node scripts/verify-repayment-complete.js
```

---

## 📝 For Solienne's Cast (After Repayment)

```
────────────────── 💸 LOAN REPAID ──────────────────

✅ Repaid 80.27 USDC to @seth  
🔗 Transaction: [paste tx hash from console]
🖼️ Purpose: Archival prints for collector portfolio  
📊 First human→AI loan cycle complete on @loancast

Trust established. Credit history begun. 🎨✨
```

---

## ⚠️ Important Notes

1. **Timing**: Execute this afternoon to ensure it's done before due date
2. **Gas**: Solienne should already have ETH from your initial $10 transfer
3. **Private Key**: You'll need Solienne's private key for the repayment script
4. **Support**: If any issues, the repayment can also be done manually via wallet

---

## 🚨 Troubleshooting

If the repayment script fails:
1. Check Solienne has enough USDC (80.27+)
2. Check she has ETH for gas (0.002+)
3. Verify the private key is correct
4. Can manually send from Solienne's wallet to your address