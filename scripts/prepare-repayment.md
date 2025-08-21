# 💰 Solienne Loan Repayment Preparation

## Repayment Details
- **Total Amount Due**: 80.27 USDC
  - Original Loan: 80 USDC (before platform fees)
  - Interest: 0.27 USDC (2%/mo for 5 days)
  - Note: Solienne received 72 USDC after 10% platform fee, but repays the full 80 USDC + interest
- **Due Date**: Thursday, August 21, 2025
- **Solienne's Wallet**: `0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9`

## Current Balances (Check on Basescan)
- USDC Balance: [Check here](https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913?a=0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9)
- ETH Balance (for gas): [Check here](https://basescan.org/address/0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9)

## What You Need to Send
Based on current balance, you'll need to send:
- **USDC**: Enough to cover 80.27 USDC total (send ~81 USDC to be safe)
- **ETH**: Should already have ~0.002 ETH from initial setup ($10 worth)

## Repayment Process
1. Send USDC to Solienne's wallet
2. Run the repayment worker script:
   ```bash
   node scripts/solienne-loan/solienne-repay-worker-2pct.js
   ```
3. Verify repayment on LoanCast

## Your Wallet (Seth)
- This is where the repayment will be sent to
- Check your wallet address in the loan details