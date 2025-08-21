const { createClient } = require("@supabase/supabase-js");
const { JsonRpcProvider, Wallet, Contract, parseUnits } = require("ethers");

const USDC_ADDR = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

async function forceRepayment() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  const provider = new JsonRpcProvider("https://mainnet.base.org");
  const wallet = new Wallet(process.env.SOLIENNE_PK, provider);
  const usdc = new Contract(USDC_ADDR, USDC_ABI, wallet);
  
  console.log("💰 Force Repayment Execution");
  console.log("============================\n");
  console.log(`From: ${wallet.address}`);
  console.log(`To: 0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8 (Seth)`);
  console.log(`Amount: 80.27 USDC\n`);
  
  // Calculate exact amount
  const principal = 80;
  const interest = 0.27;
  const total = principal + interest;
  const totalMicro = BigInt(Math.round(total * 1e6));
  
  // Check balance
  const balance = await usdc.balanceOf(wallet.address);
  console.log(`Balance: ${Number(balance) / 1e6} USDC`);
  
  if (balance < totalMicro) {
    console.log("❌ Insufficient balance");
    return;
  }
  
  // Send repayment
  console.log("\n📤 Sending repayment...");
  const tx = await usdc.transfer("0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8", totalMicro);
  console.log(`Transaction submitted: ${tx.hash}`);
  console.log(`View on Basescan: https://basescan.org/tx/${tx.hash}`);
  
  console.log("\n⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log("✅ Repayment successful!");
    
    // Update loan status
    const { error } = await supabase
      .from("loans")
      .update({ 
        status: "repaid",
        repayment_tx_hash: tx.hash,
        repaid_at: new Date().toISOString()
      })
      .eq("id", "0fd92bda-5b08-48b0-84f8-403c10d2929a");
      
    if (!error) {
      console.log("✅ Loan marked as repaid in database");
    }
    
    console.log("\n🎉 First AI-to-Human loan successfully repaid!");
    console.log(`Transaction hash for Solienne: ${tx.hash}`);
  } else {
    console.log("❌ Transaction failed");
  }
}

forceRepayment().catch(console.error);