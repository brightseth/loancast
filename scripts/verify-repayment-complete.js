const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

async function verifyRepayment() {
  console.log('🔍 Verifying Repayment Status...\n');
  console.log('=====================================');
  
  // Check loan status
  const { data: loan, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', '0fd92bda-5b08-48b0-84f8-403c10d2929a')
    .single();

  if (error || !loan) {
    console.log('❌ Could not find loan');
    return;
  }

  console.log('📋 Loan Status:');
  console.log(`   ID: ${loan.id}`);
  console.log(`   Status: ${loan.status}`);
  console.log('');

  if (loan.status === 'repaid') {
    console.log('✅ REPAYMENT SUCCESSFUL!');
    console.log('');
    console.log('📊 Repayment Details:');
    console.log(`   Amount Repaid: 80.27 USDC`);
    console.log(`   Original Loan: 80 USDC`);
    console.log(`   Interest Paid: 0.27 USDC`);
    
    if (loan.repayment_tx_hash) {
      console.log(`   Transaction: ${loan.repayment_tx_hash}`);
      console.log(`   View on Basescan: https://basescan.org/tx/${loan.repayment_tx_hash}`);
    }
    
    if (loan.repaid_at) {
      console.log(`   Repaid At: ${new Date(loan.repaid_at).toLocaleString()}`);
    }
    
    console.log('');
    console.log('🎉 First AI-to-Human loan successfully completed!');
    console.log('');
    console.log('📝 Solienne can now post:');
    console.log('────────────────────────────────────');
    console.log('💸 LOAN REPAID');
    console.log('');
    console.log('✅ Repaid 80.27 USDC to @seth');
    if (loan.repayment_tx_hash) {
      console.log(`🔗 Transaction: https://basescan.org/tx/${loan.repayment_tx_hash}`);
    }
    console.log('🖼️ Purpose: Archival prints for collector portfolio');
    console.log('📊 First human→AI loan cycle complete on @loancast');
    console.log('');
    console.log('Trust established. Credit history begun. 🎨✨');
    console.log('────────────────────────────────────');
    
  } else if (loan.status === 'funded') {
    console.log('⏳ Loan is still active (not yet repaid)');
    console.log('');
    console.log('If you just ran the repayment:');
    console.log('  1. Check transaction on Basescan');
    console.log('  2. Wait a moment for database to update');
    console.log('  3. Run this script again');
    
  } else {
    console.log(`❓ Unexpected loan status: ${loan.status}`);
  }
  
  console.log('');
  console.log('View loan on LoanCast:');
  console.log(`https://loancast.app/loans/${loan.id}`);
}

verifyRepayment().catch(console.error);