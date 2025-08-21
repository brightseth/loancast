const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

async function checkLenderAddress() {
  console.log('🔍 Checking lender addresses in database...\n');
  
  // Check loan record
  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', '0fd92bda-5b08-48b0-84f8-403c10d2929a')
    .single();
    
  console.log('📋 Loan Record:');
  console.log(`  Loan ID: ${loan.id}`);
  console.log(`  Lender Address: ${loan.lender_address || 'NOT SET'}`);
  console.log(`  Status: ${loan.status}`);
  console.log('');
  
  // Check bids
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('loan_id', loan.id)
    .order('created_at', { ascending: false });
    
  console.log('🏷️ Bids on this loan:');
  if (bids && bids.length > 0) {
    bids.forEach((bid, i) => {
      console.log(`  Bid ${i + 1}:`);
      console.log(`    Amount: ${bid.usdc_amount} USDC`);
      console.log(`    Lender Wallet: ${bid.lender_wallet}`);
      console.log(`    Status: ${bid.status}`);
      console.log(`    Created: ${new Date(bid.created_at).toLocaleDateString()}`);
      console.log('');
    });
  } else {
    console.log('  No bids found');
  }
  
  console.log('⚠️  ISSUE FOUND:');
  console.log(`  LoanCast shows: 0xA2DC...88D1`);
  console.log(`  Your wallet is: 0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8`);
  console.log('');
  console.log('🔧 To fix this:');
  console.log('  1. Update the loan record with correct lender_address');
  console.log('  2. Or have Solienne send directly to your known wallet');
  
  // Check if 0xA2DC...88D1 appears anywhere
  if (loan.lender_address && loan.lender_address.includes('A2DC')) {
    console.log('\n❌ Wrong address is in the loan record!');
    console.log('   This needs to be updated to your wallet.');
  }
}

checkLenderAddress().catch(console.error);