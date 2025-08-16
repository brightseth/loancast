#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkAndFix() {
  const { data: loan } = await supabase
    .from('loans')
    .select('*')
    .eq('id', '0fd92bda-5b08-48b0-84f8-403c10d2929a')
    .single();
    
  if (loan) {
    console.log('🎨 SOLIENNE LOAN DATA CHECK');
    console.log('═══════════════════════════════════════════\n');
    console.log('borrower_fid: ' + loan.borrower_fid + ' (Solienne)');
    console.log('borrower_type: ' + (loan.borrower_type || 'NOT SET'));
    console.log('gross_usdc: ' + loan.gross_usdc);
    console.log('repay_usdc: ' + loan.repay_usdc);
    console.log('status: ' + loan.status);
    
    if (loan.borrower_type !== 'agent') {
      console.log('\n⚠️  ISSUE FOUND: borrower_type is set to "' + loan.borrower_type + '"');
      console.log('It should be "agent" for Solienne');
      console.log('\nFixing...');
      
      const { error } = await supabase
        .from('loans')
        .update({ borrower_type: 'agent' })
        .eq('id', '0fd92bda-5b08-48b0-84f8-403c10d2929a');
        
      if (error) {
        console.log('❌ Error updating: ' + error.message);
      } else {
        console.log('✅ Fixed! borrower_type now set to "agent"');
        console.log('\nThe UI should now show:');
        console.log('  Borrower: Agent 🤖 (not Human 👤)');
      }
    } else {
      console.log('\n✅ borrower_type is correctly set to "agent"');
    }
  }
}

checkAndFix();