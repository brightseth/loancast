#!/bin/bash

# 🧑→🤖 Human to Agent Loan Execution Script
# This executes the first Human→Agent loan with Solienne

echo "═══════════════════════════════════════════"
echo "    HUMAN→AGENT LOAN WITH SOLIENNE"
echo "═══════════════════════════════════════════"
echo ""
echo "Solienne FID: 1113468"
echo "Solienne Wallet: 0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9"
echo "Loan Terms: 50 USDC @ 500bps for 7 days"
echo ""

# Check requirements
echo "📋 Requirements:"
echo "   ✅ Solienne has received 0.002 ETH for gas"
echo "   ⬜ You have 50+ USDC on Base"
echo "   ⬜ You have set environment variables"
echo ""

echo "═══════════════════════════════════════════"
echo "    STEP-BY-STEP EXECUTION"
echo "═══════════════════════════════════════════"
echo ""

echo "1️⃣ Set environment variables:"
echo ""
echo "export NEXT_PUBLIC_SUPABASE_URL=\"https://qvafjicbrsoyzdlgypuq.supabase.co\""
echo "export SUPABASE_SERVICE_KEY=\"<YOUR_SERVICE_KEY>\""
echo "export BASE_USDC_ADDRESS=\"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913\""
echo "export S_FID=1113468"
echo "export YOUR_FID=<YOUR_FARCASTER_FID>"
echo "export YOUR_WALLET=<YOUR_BASE_WALLET>"
echo "export YOUR_PRIVATE_KEY=<YOUR_PRIVATE_KEY>"
echo ""

echo "2️⃣ Create Solienne's loan request:"
echo ""
cat << 'LOAN_CREATE'
node -e '
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

(async () => {
  const loanId = crypto.randomUUID();
  const loan = {
    id: loanId,
    cast_hash: `solienne_${Date.now()}`,
    borrower_fid: 1113468,
    borrower_type: "agent",
    gross_usdc: 50,
    net_usdc: 50,
    yield_bps: 500,
    repay_usdc: 50.096,
    start_ts: new Date().toISOString(),
    due_ts: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    status: "seeking",
    loan_number: 300000 + Math.floor(Math.random() * 1000),
    description: "Working capital for Solienne print run · 🧑→🤖 pilot",
    requested_usdc: 50
  };
  
  const { data, error } = await supabase
    .from("loans")
    .insert(loan)
    .select()
    .single();
  
  if (error) throw error;
  
  console.log("✅ Loan created!");
  console.log("Loan ID:", data.id);
  console.log("Borrower: Solienne (Agent #1113468)");
  console.log("Amount: 50 USDC @ 5% for 7 days");
  console.log("");
  console.log("SAVE THIS: export LOAN_ID=" + data.id);
})().catch(console.error);
'
LOAN_CREATE

echo ""
echo "3️⃣ Record your funding intent:"
echo ""
cat << 'INTENT'
node -e '
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

(async () => {
  await supabase.from("funding_intents").insert({
    loan_id: process.env.LOAN_ID,
    lender_fid: Number(process.env.YOUR_FID),
    lender_type: "human"
  });
  console.log("✅ Funding intent recorded");
})().catch(console.error);
'
INTENT

echo ""
echo "4️⃣ Send 50 USDC to Solienne (on Base):"
echo ""
cat << 'FUND'
node -e '
const { ethers } = require("ethers");
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];

(async () => {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const wallet = new ethers.Wallet(process.env.YOUR_PRIVATE_KEY, provider);
  const usdc = new ethers.Contract(USDC, ABI, wallet);
  
  const amount = ethers.parseUnits("50", 6);
  const tx = await usdc.transfer("0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9", amount);
  console.log("⏳ Sending USDC...", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Funded! Tx:", receipt.hash);
  console.log("View on Base: https://basescan.org/tx/" + receipt.hash);
  
  // Update loan status
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  await supabase.from("loans").update({
    status: "funded",
    lender_fid: Number(process.env.YOUR_FID),
    lender_type: "human",
    lender_address: process.env.YOUR_WALLET,
    tx_fund: receipt.hash,
    funded_at: new Date().toISOString()
  }).eq("id", process.env.LOAN_ID);
  
  console.log("✅ Loan marked as funded");
})().catch(console.error);
'
FUND

echo ""
echo "5️⃣ Solienne's autonomous repayment (after 7 days):"
echo ""
echo "Save this as solienne-repay.js and run with cron:"
echo ""
cat << 'REPAY'
const { ethers } = require("ethers");
const { createClient } = require("@supabase/supabase-js");

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ABI = ["function transfer(address to, uint256 amount) returns (bool)"];

(async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const wallet = new ethers.Wallet(process.env.SOLIENNE_PK, provider);
  const usdc = new ethers.Contract(USDC, ABI, wallet);
  
  const { data: loans } = await supabase
    .from("loans")
    .select("*")
    .eq("borrower_fid", 1113468)
    .eq("status", "funded");
  
  for (const loan of loans || []) {
    if (new Date() < new Date(loan.due_ts)) continue;
    
    const amount = ethers.parseUnits(loan.repay_usdc.toString(), 6);
    const tx = await usdc.transfer(loan.lender_address, amount);
    await tx.wait();
    
    await supabase.from("loans").update({
      status: "repaid",
      tx_repay: tx.hash
    }).eq("id", loan.id);
    
    console.log("✅ Solienne repaid loan:", loan.id);
    console.log("Transaction:", tx.hash);
  }
})();
REPAY

echo ""
echo "═══════════════════════════════════════════"
echo "    🏛️ HISTORIC HUMAN→AGENT LOAN"
echo "═══════════════════════════════════════════"
echo ""
echo "When complete, you'll have:"
echo "• First Human→Agent loan on LoanCast"
echo "• On-chain USDC transactions on Base"
echo "• Autonomous repayment by Solienne"
echo ""
echo "Share the proof:"
echo "• Loan page: loancast.app/loans/<LOAN_ID>"
echo "• Funding tx on BaseScan"
echo "• Repayment tx on BaseScan"
echo ""