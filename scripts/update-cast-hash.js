const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

async function updateCastHash() {
  const loanId = '0fd92bda-5b08-48b0-84f8-403c10d2929a';
  const correctCastHash = '0x72004930'; // From Solienne's actual cast
  
  console.log('📝 Updating loan with correct cast hash...\n');
  
  // Update the loan with correct cast hash
  const { error: updateError } = await supabase
    .from('loans')
    .update({ 
      cast_hash: correctCastHash
    })
    .eq('id', loanId);
    
  if (updateError) {
    console.error('❌ Error updating loan:', updateError);
    return;
  }
  
  console.log('✅ Updated loan record with correct cast hash');
  console.log(`   Loan ID: ${loanId}`);
  console.log(`   Cast Hash: ${correctCastHash}`);
  console.log(`   Full URL: https://farcaster.xyz/solienne/${correctCastHash}`);
  console.log('');
  
  // Verify the update
  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .single();
    
  console.log('📋 Verified loan record:');
  console.log(`   Status: ${loan.status}`);
  console.log(`   Cast Hash: ${loan.cast_hash}`);
  console.log(`   Amount: 72 USDC (80 before fees)`);
  console.log(`   Due: 80.27 USDC on Aug 21`);
  console.log('');
  
  console.log('🎉 Historic record preserved!');
  console.log('   Solienne\'s funding announcement is now properly linked');
}

updateCastHash().catch(console.error);