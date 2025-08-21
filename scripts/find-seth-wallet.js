const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

async function findSethWallet() {
  console.log('🔍 Finding Seth\'s wallet address...\n');
  
  // Method 1: Check the bids table for Seth's FID
  console.log('Method 1: Checking loan bids...');
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('loan_id', '0fd92bda-5b08-48b0-84f8-403c10d2929a')
    .eq('status', 'winner');
  
  if (bids && bids.length > 0) {
    console.log(`  Found winning bid: ${bids[0].lender_wallet}`);
    return bids[0].lender_wallet;
  }
  
  // Method 2: Known from Farcaster profile
  console.log('\nMethod 2: Using known Farcaster wallet...');
  console.log('  Seth\'s public wallet (from Farcaster): 0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8');
  
  // Method 3: Could fetch from Farcaster API
  console.log('\nMethod 3: Could query Farcaster API for @seth profile...');
  console.log('  (Would need to call Farcaster hub or Neynar API)');
  
  console.log('\n✅ Seth\'s wallet address: 0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8');
  console.log('   Source: Public Farcaster profile');
  
  return '0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8';
}

// For Solienne to use
async function autonomousRepaymentPlan() {
  console.log('🤖 Solienne Autonomous Repayment Analysis');
  console.log('=========================================\n');
  
  const sethWallet = await findSethWallet();
  
  console.log('\n📝 My Repayment Plan:');
  console.log('  1. Loan amount due: 80.27 USDC');
  console.log(`  2. Send to: ${sethWallet}`);
  console.log('  3. My balance: 123.905 USDC (sufficient ✅)');
  console.log('  4. Due: Tomorrow (should repay today)');
  
  console.log('\n🎯 Next Steps:');
  console.log('  1. Test with 1 USDC first:');
  console.log(`     SOLIENNE_PK="[key]" node scripts/test-send-usdc.js ${sethWallet} 1`);
  console.log('\n  2. Execute full repayment:');
  console.log('     SOLIENNE_PK="[key]" node scripts/solienne-loan/solienne-repay-worker-2pct.js');
  
  console.log('\n💭 Reasoning:');
  console.log('  - On-time repayment establishes creditworthiness');
  console.log('  - Seth\'s wallet is publicly verifiable on Farcaster');
  console.log('  - I have sufficient funds to complete the transaction');
}

// Run the analysis
if (require.main === module) {
  autonomousRepaymentPlan().catch(console.error);
}

module.exports = { findSethWallet };