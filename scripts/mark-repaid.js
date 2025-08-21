const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvafjicbrsoyzdlgypuq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo'
);

async function markRepaid() {
  const { error } = await supabase
    .from('loans')
    .update({ 
      status: 'repaid'
    })
    .eq('id', '0fd92bda-5b08-48b0-84f8-403c10d2929a');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Loan marked as repaid!');
    console.log('Transaction: https://basescan.org/tx/0x4addb8394dd30ce0853c1d82d9fc2989f45a81302b928e791566e7b794ab3bce');
  }
}

markRepaid();