const { createClient } = require('@supabase/supabase-js');
const { JsonRpcProvider } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

const SOLIENNE_WALLET = '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const REQUIRED_USDC = 80.27;
const REQUIRED_ETH = 0.002;

async function verifyReadiness() {
  console.log('🔍 Verifying Repayment Readiness...\n');
  console.log('=====================================');
  
  // 1. Check loan details
  const { data: loan, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', '0fd92bda-5b08-48b0-84f8-403c10d2929a')
    .single();

  if (error || !loan) {
    console.log('❌ Could not find loan');
    return false;
  }

  console.log('📋 Loan Details:');
  console.log(`   ID: ${loan.id}`);
  console.log(`   Status: ${loan.status}`);
  console.log(`   Amount: 80 USDC (she received 72 after fees)`);
  console.log(`   Repayment Due: 80.27 USDC`);
  console.log('');

  // 2. Check ETH balance
  const provider = new JsonRpcProvider('https://mainnet.base.org');
  const ethBalance = await provider.getBalance(SOLIENNE_WALLET);
  const ethInEther = parseFloat(ethBalance.toString()) / 1e18;
  
  console.log('⛽ Gas Check:');
  console.log(`   ETH Balance: ${ethInEther.toFixed(6)} ETH`);
  console.log(`   Required: ${REQUIRED_ETH} ETH`);
  console.log(`   Status: ${ethInEther >= REQUIRED_ETH ? '✅ Sufficient' : '❌ Insufficient'}`);
  console.log('');

  // 3. Check USDC balance (manual check needed)
  console.log('💵 USDC Check:');
  console.log(`   Required: ${REQUIRED_USDC} USDC`);
  console.log(`   Check balance at:`);
  console.log(`   https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913?a=${SOLIENNE_WALLET}`);
  console.log('');

  // 4. Summary
  console.log('=====================================');
  console.log('📊 READINESS CHECKLIST:');
  console.log(`   [ ] Solienne has ${REQUIRED_USDC}+ USDC`);
  console.log(`   [${ethInEther >= REQUIRED_ETH ? '✅' : '❌'}] Solienne has ${REQUIRED_ETH}+ ETH for gas`);
  console.log(`   [${loan.status === 'funded' ? '✅' : '❌'}] Loan status is 'funded'`);
  console.log('');

  if (ethInEther < REQUIRED_ETH) {
    console.log('⚠️  ACTION NEEDED: Send more ETH to Solienne for gas');
  }
  
  console.log('⚠️  ACTION NEEDED: Verify USDC balance manually (link above)');
  console.log('    If insufficient, send USDC to:', SOLIENNE_WALLET);
  
  return true;
}

verifyReadiness().catch(console.error);