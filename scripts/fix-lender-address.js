const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

async function fixLenderAddress() {
  const loanId = '0fd92bda-5b08-48b0-84f8-403c10d2929a';
  const sethWallet = '0x7c7BeC19B92eC2928AFd95BC9fC8c4277F14F0a8';
  
  console.log('🔧 Fixing lender address in database...\n');
  
  // Update the loan with Seth's correct wallet
  const { error: updateError } = await supabase
    .from('loans')
    .update({ 
      lender_address: sethWallet,
      lender_fid: 1345 // Seth's FID if needed
    })
    .eq('id', loanId);
    
  if (updateError) {
    console.error('❌ Error updating loan:', updateError);
    return;
  }
  
  console.log('✅ Updated loan record with correct lender address');
  console.log(`   Loan ID: ${loanId}`);
  console.log(`   Lender: Seth`);
  console.log(`   Wallet: ${sethWallet}`);
  console.log('');
  
  // Verify the update
  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .single();
    
  console.log('📋 Verified loan record:');
  console.log(`   Status: ${loan.status}`);
  console.log(`   Lender Address: ${loan.lender_address}`);
  console.log(`   Amount Due: 80.27 USDC`);
  console.log('');
  console.log('✅ Database fixed! Solienne should now repay to:');
  console.log(`   ${sethWallet}`);
}

fixLenderAddress().catch(console.error);