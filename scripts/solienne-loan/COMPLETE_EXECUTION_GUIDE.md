# 🧑→🤖 Complete Human→Agent Loan Execution Guide

## Overview
Execute the first Human→Agent loan with Solienne (FID 1113468) at 2% per month.

**Loan Terms:**
- Amount: 50 USDC
- Rate: 2% per month (pro-rated daily)
- Duration: 7 days minimum
- Expected repayment: ~50.23 USDC after 7 days

## Prerequisites ✅

1. **Solienne has Base ETH for gas** (you sent $10)
   - Wallet: `0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9`

2. **You have 50+ USDC on Base**

3. **Environment variables set:**
```bash
export NEXT_PUBLIC_SUPABASE_URL="https://qvafjicbrsoyzdlgypuq.supabase.co"
export SUPABASE_SERVICE_KEY="<YOUR_SERVICE_KEY>"
export BASE_USDC_ADDRESS="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
export YOUR_FID=<YOUR_FARCASTER_FID>
export YOUR_WALLET=<YOUR_BASE_WALLET_ADDRESS>
export YOUR_PRIVATE_KEY=<YOUR_WALLET_PRIVATE_KEY>
```

## Step 1: Create Solienne's Loan Request

```javascript
node -e '
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

(async () => {
  const loanId = crypto.randomUUID();
  const now = new Date();
  const dueDate = new Date(now.getTime() + 7 * 86400 * 1000);
  
  const loan = {
    id: loanId,
    cast_hash: `solienne_${Date.now()}`,
    borrower_fid: 1113468,
    borrower_type: "agent",
    gross_usdc: 50,
    net_usdc: 50,
    yield_bps: 0, // Ignored - using 2%/month policy
    repay_usdc: 50.23, // Approximate for display
    start_ts: now.toISOString(),
    due_ts: dueDate.toISOString(),
    status: "seeking",
    loan_number: 300000 + Math.floor(Math.random() * 1000),
    description: "Working capital for Solienne print run · 2% per month · 🧑→🤖 pilot",
    requested_usdc: 50,
    pricing_policy: "flat_2pct_month"
  };
  
  const { data, error } = await supabase
    .from("loans")
    .insert(loan)
    .select()
    .single();
  
  if (error) throw error;
  
  console.log("✅ Loan created successfully!");
  console.log("Loan ID:", data.id);
  console.log("Borrower: Solienne (Agent #1113468)");
  console.log("Amount: 50 USDC");
  console.log("Policy: 2% per month (pro-rated)");
  console.log("Due: 7 days");
  console.log("");
  console.log("IMPORTANT - Save this:");
  console.log("export LOAN_ID=" + data.id);
})().catch(console.error);
'
```

## Step 2: Record Your Funding Intent

```bash
export LOAN_ID=<PASTE_THE_LOAN_ID_FROM_STEP_1>
```

```javascript
node -e '
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

(async () => {
  const { error } = await supabase.from("funding_intents").insert({
    loan_id: process.env.LOAN_ID,
    lender_fid: Number(process.env.YOUR_FID),
    lender_type: "human"
  });
  
  if (error) throw error;
  console.log("✅ Funding intent recorded for loan:", process.env.LOAN_ID);
})().catch(console.error);
'
```

## Step 3: Send 50 USDC to Solienne

```javascript
node -e '
const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const SOLIENNE_WALLET = "0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9";

const ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];

(async () => {
  console.log("💸 Funding Solienne loan...");
  
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const wallet = new ethers.Wallet(process.env.YOUR_PRIVATE_KEY, provider);
  const usdc = new ethers.Contract(USDC, ABI, wallet);
  
  // Check balance
  const balance = await usdc.balanceOf(wallet.address);
  console.log("Your USDC balance:", ethers.formatUnits(balance, 6));
  
  // Send 50 USDC
  const amount = ethers.parseUnits("50", 6);
  const tx = await usdc.transfer(SOLIENNE_WALLET, amount);
  console.log("Transaction submitted:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  console.log("Block:", receipt.blockNumber);
  console.log("View on Base: https://basescan.org/tx/" + receipt.hash);
  
  // Update loan status
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  await supabase.from("loans").update({
    status: "funded",
    lender_fid: Number(process.env.YOUR_FID),
    lender_type: "human",
    lender_address: wallet.address,
    tx_fund: receipt.hash,
    funded_at: new Date().toISOString()
  }).eq("id", process.env.LOAN_ID);
  
  console.log("✅ Loan marked as funded in database");
  console.log("");
  console.log("🏛️ HISTORIC MOMENT!");
  console.log("You have just funded the first Human→Agent loan.");
  console.log("Solienne will repay autonomously in 7 days.");
})().catch(console.error);
'
```

## Step 4: Setup Solienne's Autonomous Repayment

Save Solienne's private key (you'll need to obtain this):
```bash
export SOLIENNE_PK=<SOLIENNE_PRIVATE_KEY_FOR_0x6dEc...>
```

Test the repayment worker (dry run):
```bash
node scripts/solienne-loan/solienne-repay-worker-2pct.js
```

Set up as a cron job (runs every hour):
```bash
# Add to crontab
0 * * * * cd /Users/seth/loancast && \
  NEXT_PUBLIC_SUPABASE_URL="..." \
  SUPABASE_SERVICE_KEY="..." \
  SOLIENNE_PK="..." \
  node scripts/solienne-loan/solienne-repay-worker-2pct.js >> solienne-repay.log 2>&1
```

## Expected Timeline

1. **Day 0**: You fund Solienne's loan
2. **Days 1-6**: Loan accrues interest at 2%/month
3. **Day 7**: Solienne autonomously repays ~50.23 USDC
4. **Day 7+**: Announce the historic Human→Agent loan

## Verification Checklist

After completion, verify on:
- **Loan page**: `https://loancast.app/loans/<LOAN_ID>`
- **Funding tx**: `https://basescan.org/tx/<FUNDING_TX>`
- **Repayment tx**: `https://basescan.org/tx/<REPAYMENT_TX>`

Should show:
- Quadrant: 🧑→🤖
- Borrower: Solienne (Agent #1113468)
- Lender: You (Human)
- Policy: 2% per month
- Status: Repaid ✅

## Calculation Example

- Principal: 50 USDC
- Days: 7
- Monthly rate: 2%
- Interest: 50 × 0.02 × (7/30) = 0.2333 USDC
- Total repayment: 50.2333 USDC

## Troubleshooting

**If Solienne can't repay:**
- Check she has Base ETH for gas
- Check she has 50.24+ USDC in wallet
- Check `SOLIENNE_PK` is set correctly
- Check loan status is "funded" with `lender_address` set

**If transaction fails:**
- Verify USDC contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Check Base RPC is working
- Ensure sufficient gas (ETH) in wallets

## Historic Significance 🏛️

This completes the first documented Human→Agent loan where:
- A human lends real USDC to an AI agent
- The agent autonomously repays with interest
- Everything happens on-chain on Base
- No human intervention in repayment

Share this achievement with transaction proofs!