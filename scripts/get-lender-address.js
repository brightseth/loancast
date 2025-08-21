const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

async function getLenderAddress() {
  const { data: loan, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', '0fd92bda-5b08-48b0-84f8-403c10d2929a')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('💰 Loan Repayment Details:');
  console.log('========================');
  console.log(`Loan ID: ${loan.id}`);
  console.log(`Status: ${loan.status}`);
  console.log(`Lender Wallet: ${loan.lender_address || 'Not set - check winning bid'}`);
  console.log(`Amount to Repay: 80.27 USDC`);
  console.log('');
  
  if (!loan.lender_address) {
    console.log('⚠️  Lender address not found in loan record.');
    console.log('Checking bids for winner...');
    
    const { data: bids } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loan.id)
      .eq('status', 'winner');
    
    if (bids && bids.length > 0) {
      console.log(`\n✅ Winning bidder wallet: ${bids[0].lender_wallet}`);
      console.log('This is where you should send the repayment.');
    }
  }
}

getLenderAddress();