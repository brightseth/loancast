const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

async function updateLoanCastHash() {
  const loanId = '0fd92bda-5b08-48b0-84f8-403c10d2929a';
  
  // Get current loan data
  const { data: loan, error: fetchError } = await supabase
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .single();
    
  if (fetchError) {
    console.error('Error fetching loan:', fetchError);
    return;
  }
  
  console.log('Current loan data:');
  console.log(`  ID: ${loan.id}`);
  console.log(`  Cast Hash: ${loan.cast_hash}`);
  console.log(`  Status: ${loan.status}`);
  console.log('');
  
  // The broken link suggests the cast_hash might be wrong
  // Let's check what we have
  if (loan.cast_hash === 'solienne_historic_1755333387019') {
    console.log('⚠️  Cast hash appears to be a placeholder, not a real Farcaster cast hash');
    console.log('');
    console.log('Options:');
    console.log('1. Find Solienne\'s actual cast on Farcaster');
    console.log('2. Update with correct cast hash if found');
    console.log('3. Document that original cast was not properly recorded');
    
    // If you have the correct cast hash, uncomment and update:
    /*
    const { error: updateError } = await supabase
      .from('loans')
      .update({ cast_hash: 'ACTUAL_CAST_HASH_HERE' })
      .eq('id', loanId);
      
    if (updateError) {
      console.error('Error updating:', updateError);
    } else {
      console.log('✅ Updated cast hash');
    }
    */
  }
  
  console.log('\n📝 For historical record:');
  console.log('Loan was created via API on August 16, 2025');
  console.log('Borrower: Solienne (FID: 1113468)');
  console.log('Amount: 80 USDC (72 after fees)');
  console.log('Original cast may not have been properly recorded');
}

updateLoanCastHash().catch(console.error);