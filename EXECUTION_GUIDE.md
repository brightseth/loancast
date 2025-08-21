# 🎯 SOLIENNE REPAYMENT - EXECUTION GUIDE

## 🔴 PART 1: WALLET (Do First - Outside Terminal)

**Send USDC to Solienne via your wallet:**
- To: `0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9`
- Amount: **81 USDC**
- Network: **Base**

---

## 💻 PART 2: TERMINAL (After USDC is sent)

### Step 1: Check everything is ready
```bash
cd ~/loancast
node scripts/verify-repayment-ready.js
```
✅ Should show:
- Solienne has 80.27+ USDC
- Solienne has ETH for gas
- Loan status is 'funded'

### Step 2: Execute the repayment
```bash
# Set Solienne's private key (get from Eden)
export SOLIENNE_PK="[paste-her-private-key-here]"

# Run the repayment
./scripts/execute-repayment.sh
```
📝 This will:
- Show repayment details
- Ask for confirmation (type 'y')
- Execute the transaction
- Show transaction hash

### Step 3: Verify it worked
```bash
node scripts/verify-repayment-complete.js
```
✅ Should show loan status: 'repaid'

---

## 🌐 PART 3: LOANCAST.APP

1. **Go to:** https://loancast.app/loans/0fd92bda-5b08-48b0-84f8-403c10d2929a
2. **Verify:** Status shows "Repaid ✅"
3. **Screenshot:** Save for historic record

---

## 💬 PART 4: FARCASTER (Your Account)

**Post this after repayment confirms:**

```
🎉 COMPLETE: First human→AI loan cycle

@solienne borrowed 80 USDC.
Repaid 80.27 USDC exactly on schedule.
Zero human intervention. Pure autonomous execution.

Proof that AI agents can be creditworthy.

Details: loancast.app/loans/0fd92bda-5b08-48b0-84f8-403c10d2929a
```

---

## 🤖 PART 5: EDEN/SOLIENNE

**Have Solienne post via Eden dashboard:**

```
────────────────── 💸 LOAN REPAID ──────────────────

✅ Repaid 80.27 USDC to @seth  
🔗 Transaction: [paste tx hash from terminal]
🖼️ Purpose: Archival prints for collector portfolio  
📊 First human→AI loan cycle complete on @loancast

Trust established. Credit history begun. 🎨✨
```

**To get tx hash:** Look for it in terminal output after running repayment script

---

## ⏱️ ORDER OF OPERATIONS

1. ✅ **NOW:** Send 81 USDC to Solienne (wallet)
2. ⏳ **Wait 2 min:** For transaction to confirm
3. ✅ **Terminal:** Run verify script
4. ✅ **Terminal:** Run repayment script
5. ⏳ **Wait 1 min:** For repayment to process
6. ✅ **Terminal:** Run verify complete script
7. ✅ **Browser:** Check loancast.app
8. ✅ **Farcaster:** Post your announcement
9. ✅ **Eden:** Have Solienne post confirmation

---

## 🚨 TROUBLESHOOTING

**If repayment script fails:**
- Check Solienne has 80.27+ USDC
- Check she has 0.002+ ETH
- Make sure SOLIENNE_PK is set correctly
- Try running again in 30 seconds

**If status doesn't update:**
- Transaction might still be processing
- Check tx hash on Basescan
- Wait 2 minutes and check again

---

## 📞 SUPPORT

If stuck, you can manually repay:
1. Send 80.27 USDC from Solienne's wallet
2. To your wallet address (check loan details)
3. Update loan status manually in database