#!/usr/bin/env node

/**
 * Clean up test loans before Solienne's historic first real loan
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function cleanupTestLoans() {
  console.log('🧹 Cleaning up test loans...\n');
  
  // Find all test loans (various patterns we used)
  const { data: testLoans, error: fetchError } = await supabase
    .from('loans')
    .select('id, cast_hash, borrower_fid, description, created_at')
    .or(`cast_hash.like.test_%,cast_hash.like.demo_%,cast_hash.like.smoke_%,cast_hash.like.agent_%,cast_hash.like.solienne_cast_%`)
    .order('created_at', { ascending: false });
  
  if (fetchError) {
    console.error('Error fetching loans:', fetchError);
    return;
  }
  
  if (!testLoans || testLoans.length === 0) {
    console.log('✅ No test loans found - system is clean');
    return;
  }
  
  console.log(`Found ${testLoans.length} test loans to clean up:\n`);
  
  // Show what we're deleting
  testLoans.forEach(loan => {
    console.log(`  - ${loan.id.substring(0, 8)}... (FID: ${loan.borrower_fid}, ${loan.description || 'no description'})`);
  });
  
  console.log('\nDeleting test loans...');
  
  // Delete them
  const { error: deleteError } = await supabase
    .from('loans')
    .delete()
    .or(`cast_hash.like.test_%,cast_hash.like.demo_%,cast_hash.like.smoke_%,cast_hash.like.agent_%,cast_hash.like.solienne_cast_%`);
  
  if (deleteError) {
    console.error('Error deleting loans:', deleteError);
    return;
  }
  
  console.log('✅ Test loans deleted\n');
  
  // Also clean up any test funding intents
  const { data: intents, error: intentsError } = await supabase
    .from('funding_intents')
    .select('id, loan_id')
    .in('loan_id', testLoans.map(l => l.id));
  
  if (intents && intents.length > 0) {
    console.log(`Cleaning up ${intents.length} test funding intents...`);
    
    const { error: deleteIntentsError } = await supabase
      .from('funding_intents')
      .delete()
      .in('loan_id', testLoans.map(l => l.id));
    
    if (deleteIntentsError) {
      console.error('Error deleting intents:', deleteIntentsError);
    } else {
      console.log('✅ Funding intents cleaned\n');
    }
  }
  
  // Verify Solienne has no active loans
  const { data: solienneLoans } = await supabase
    .from('loans')
    .select('id, status')
    .eq('borrower_fid', 1113468);
  
  if (solienneLoans && solienneLoans.length > 0) {
    console.log('⚠️  Warning: Solienne has existing loans:');
    solienneLoans.forEach(loan => {
      console.log(`  - ${loan.id} (${loan.status})`);
    });
  } else {
    console.log('✅ Solienne has no existing loans - ready for historic first!\n');
  }
  
  console.log('🎨 System is clean and ready for Solienne\'s first real loan!');
}

cleanupTestLoans().catch(console.error);