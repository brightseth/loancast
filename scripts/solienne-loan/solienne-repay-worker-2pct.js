// solienne-repay-worker-2pct.js
// Repays funded loans for Solienne at a fixed 2%/month, pro-rated by days.
// Assumes: USDC (6dp) on Base, lender_address stored on the loan.
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, RPC_URL, SOLIENNE_PK

const { createClient } = require("@supabase/supabase-js");
const { JsonRpcProvider, Wallet, Contract, parseUnits } = require("ethers");

const USDC_ADDR = process.env.BASE_USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
const USDC_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// --- policy ---
const MONTHLY_RATE = 0.02;     // 2% per month
const DAYS_PER_MONTH = 30;     // pro-rate by 30-day month
const MIN_MICRO_USDC_INTEREST = 1n; // never 0 interest (1 micro-USDC)

async function main() {
  // — setup
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const provider = new JsonRpcProvider(process.env.RPC_URL || "https://mainnet.base.org");
  const wallet = new Wallet(process.env.SOLIENNE_PK, provider);
  const usdc = new Contract(USDC_ADDR, USDC_ABI, wallet);

  console.log(`🤖 Solienne Repayment Worker (2%/month)`);
  console.log(`   Wallet: ${wallet.address}`);
  console.log(`   Policy: ${MONTHLY_RATE * 100}% per ${DAYS_PER_MONTH}-day month\n`);

  // — fetch funded loans for Solienne (FID 1113468)
  const { data: loans, error } = await supabase
    .from("loans")
    .select("*")
    .eq("borrower_type", "agent")
    .eq("borrower_fid", 1113468)
    .eq("status", "funded")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!loans || loans.length === 0) {
    console.log("No funded loans to repay.");
    return;
  }

  console.log(`Found ${loans.length} funded loan(s) to check\n`);
  const now = Date.now();

  for (const loan of loans) {
    console.log(`Checking loan ${loan.id.substring(0, 8)}...`);
    
    // respect due date
    const dueMs = new Date(loan.due_ts).getTime();
    if (Number.isFinite(dueMs) && now < dueMs) {
      const hoursLeft = Math.ceil((dueMs - now) / 3_600_000);
      console.log(`   Not due yet (${hoursLeft} hours remaining)\n`);
      continue;
    }

    let lenderAddr = loan.lender_address;
    if (!lenderAddr) {
      // Use Seth's public wallet from Farcaster
      lenderAddr = '0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8';
      console.log(`   ℹ️ Using Seth's public wallet: ${lenderAddr}`);
    }

    // principal in micro-USDC (integer)
    const principalMicro = BigInt(Math.round(Number(loan.gross_usdc) * 1e6));

    // days outstanding (at least 1)
    const fundedMs = new Date(loan.created_at).getTime();
    const days = Math.max(1, Math.ceil((now - fundedMs) / 86_400_000));

    // interest = principal * 0.02 * (days/30)
    const interestFloat = Number(loan.gross_usdc) * MONTHLY_RATE * (days / DAYS_PER_MONTH);
    let interestMicro = BigInt(Math.round(interestFloat * 1e6));
    if (interestMicro < MIN_MICRO_USDC_INTEREST) interestMicro = MIN_MICRO_USDC_INTEREST;

    const totalMicro = principalMicro + interestMicro;

    console.log(`   Principal: ${loan.gross_usdc} USDC`);
    console.log(`   Days outstanding: ${days}`);
    console.log(`   Interest (2%/mo): ${(Number(interestMicro) / 1e6).toFixed(4)} USDC`);
    console.log(`   Total repayment: ${(Number(totalMicro) / 1e6).toFixed(4)} USDC`);

    // balance check
    const bal = await usdc.balanceOf(wallet.address);
    if (bal < totalMicro) {
      console.log(`   ⛽ Insufficient USDC (need ${Number(totalMicro) / 1e6}, have ${Number(bal) / 1e6})\n`);
      continue;
    }

    // repay
    console.log(`   💸 Sending repayment to ${lenderAddr.substring(0, 10)}...`);
    const tx = await usdc.transfer(lenderAddr, totalMicro);
    console.log(`   ⏳ Transaction submitted: ${tx.hash}`);
    const rec = await tx.wait();
    console.log(`   ✅ Transaction confirmed!`);

    // mark repaid
    const { error: upErr } = await supabase
      .from("loans")
      .update({
        status: "repaid",
        tx_repay: rec.hash,
        repaid_at: new Date().toISOString(),
        // Store computed values for transparency
        actual_interest_usdc: Number(interestMicro) / 1e6,
        actual_repay_usdc: Number(totalMicro) / 1e6,
        repayment_policy: "flat_2pct_month"
      })
      .eq("id", loan.id);

    if (upErr) {
      console.log(`   ⚠️ Repaid on-chain but failed to update DB:`, upErr.message);
    } else {
      console.log(`   ✅ Loan ${loan.id.substring(0, 8)} fully repaid!`);
      console.log(`   View on Base: https://basescan.org/tx/${rec.hash}\n`);
      
      // Historic moment if this was a human lender
      if (loan.lender_type === 'human') {
        console.log('═══════════════════════════════════════════');
        console.log('    🏛️ HISTORIC HUMAN→AGENT LOAN COMPLETE');
        console.log('═══════════════════════════════════════════');
        console.log(`Solienne (Agent #1113468) has autonomously repaid a human lender!`);
        console.log(`Transaction: https://basescan.org/tx/${rec.hash}`);
        console.log('═══════════════════════════════════════════\n');
      }
    }
  }
  
  console.log('🤖 Solienne repayment check complete');
}

main().catch((e) => {
  console.error('❌ Error:', e.message || e);
  process.exit(1);
});