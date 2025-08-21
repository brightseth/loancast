const { createClient } = require('@supabase/supabase-js');
const { JsonRpcProvider, Wallet, Contract, parseUnits } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const SOLIENNE_FID = 1113468;
const SOLIENNE_WALLET = '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9';

async function checkAndPrepareRepayment() {
  console.log('🤖 Solienne Autonomous Loan Check');
  console.log('==================================\n');

  // 1. Find my active loans
  console.log('📋 Checking my outstanding loans...');
  const { data: loans, error } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_fid', SOLIENNE_FID)
    .eq('status', 'funded')
    .order('created_at', { ascending: false });

  if (error || !loans || loans.length === 0) {
    console.log('✅ No outstanding loans found.');
    return;
  }

  const loan = loans[0]; // Most recent funded loan
  
  // 2. Calculate repayment details
  const originalAmount = 80; // The full amount before platform fees
  const termDays = loan.term_days || 5;
  const ratePct = loan.rate_pct || 2;
  const interest = originalAmount * (ratePct / 100) * (termDays / 30);
  const totalRepayment = originalAmount + interest;
  
  const createdDate = new Date(loan.created_at);
  const dueDate = new Date(createdDate);
  dueDate.setDate(dueDate.getDate() + termDays);
  const daysRemaining = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));

  console.log('\n📊 Loan Analysis:');
  console.log(`  Loan ID: ${loan.id}`);
  console.log(`  Original Amount: ${originalAmount} USDC`);
  console.log(`  Interest Rate: ${ratePct}%/month`);
  console.log(`  Term: ${termDays} days`);
  console.log(`  Due Date: ${dueDate.toDateString()}`);
  console.log(`  Days Remaining: ${daysRemaining}`);
  console.log(`  Total Repayment: ${totalRepayment.toFixed(2)} USDC`);

  // 3. Find the lender
  console.log('\n🔍 Identifying lender...');
  
  let lenderAddress = loan.lender_address;
  
  if (!lenderAddress) {
    // Check winning bid for lender address
    const { data: bids } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loan.id)
      .eq('status', 'winner')
      .single();
    
    if (bids) {
      lenderAddress = bids.lender_wallet;
    }
  }

  if (!lenderAddress) {
    console.log('❌ Could not determine lender address');
    return;
  }

  console.log(`  Lender Wallet: ${lenderAddress}`);

  // 4. Check my balance
  if (!process.env.SOLIENNE_PK) {
    console.log('\n⚠️  To execute repayment, run with:');
    console.log(`  SOLIENNE_PK="your-private-key" node ${process.argv[1]}`);
    console.log('\n📝 Repayment Plan Summary:');
    console.log(`  • Send ${totalRepayment.toFixed(2)} USDC to ${lenderAddress}`);
    console.log(`  • Recommendation: Repay ${daysRemaining <= 1 ? 'TODAY' : 'soon'} to maintain good credit`);
    return;
  }

  const provider = new JsonRpcProvider('https://mainnet.base.org');
  const wallet = new Wallet(process.env.SOLIENNE_PK, provider);
  const usdc = new Contract(USDC_ADDRESS, USDC_ABI, wallet);
  
  const balance = await usdc.balanceOf(wallet.address);
  const decimals = await usdc.decimals();
  const balanceFormatted = (Number(balance) / 10 ** decimals).toFixed(2);
  
  console.log('\n💰 Wallet Status:');
  console.log(`  My Balance: ${balanceFormatted} USDC`);
  console.log(`  Required: ${totalRepayment.toFixed(2)} USDC`);
  console.log(`  Sufficient: ${parseFloat(balanceFormatted) >= totalRepayment ? '✅ Yes' : '❌ No'}`);

  // 5. Decision point
  console.log('\n🤔 Decision Analysis:');
  if (daysRemaining <= 0) {
    console.log('  ⚠️  LOAN IS OVERDUE - Immediate repayment required');
  } else if (daysRemaining === 1) {
    console.log('  ⚠️  LOAN DUE TOMORROW - Repay today to ensure on-time');
  } else {
    console.log(`  ✅ ${daysRemaining} days remaining - On-time repayment builds credit`);
  }

  console.log('\n📝 Autonomous Decision:');
  console.log('  Based on my analysis, I should repay this loan today to:');
  console.log('  • Establish strong credit history');
  console.log('  • Demonstrate reliability as an AI agent');
  console.log('  • Enable future borrowing opportunities');
  
  console.log('\n🎯 Ready to Execute:');
  console.log(`  Command: SOLIENNE_PK="[key]" node scripts/solienne-loan/solienne-repay-worker-2pct.js`);
  console.log(`  This will send ${totalRepayment.toFixed(2)} USDC to ${lenderAddress}`);
  
  return {
    loanId: loan.id,
    lenderAddress,
    repaymentAmount: totalRepayment.toFixed(2),
    daysRemaining,
    canRepay: parseFloat(balanceFormatted) >= totalRepayment
  };
}

// Run the check
checkAndPrepareRepayment().catch(console.error);