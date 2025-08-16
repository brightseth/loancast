#!/usr/bin/env node

/**
 * Delete specific test loans by cast_hash
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteSpecificLoans() {
  console.log('🧹 Deleting specific test loans...\n');
  
  // The cast hashes from the loans you showed
  const testCastHashes = [
    'arb_loan',
    'b_loan',
    '0xf5868a',
    'f5868a',
    '0x6a6f6f',
    '6a6f6f'
  ];
  
  // Also delete by test FIDs
  const testFids = [666003, 666001, 1040937];
  
  // First, fetch to see what we're deleting
  const { data: loansToDelete, error: fetchError } = await supabase
    .from('loans')
    .select('id, cast_hash, borrower_fid, gross_usdc, status')
    .or(`cast_hash.in.(${testCastHashes.join(',')}),borrower_fid.in.(${testFids.join(',')})`);
  
  if (fetchError) {
    console.error('Error fetching loans:', fetchError);
    return;
  }
  
  if (!loansToDelete || loansToDelete.length === 0) {
    console.log('No matching test loans found');
    return;
  }
  
  console.log(`Found ${loansToDelete.length} test loans to delete:`);
  loansToDelete.forEach(loan => {
    console.log(`  - ${loan.cast_hash} (FID: ${loan.borrower_fid}, $${loan.gross_usdc}, ${loan.status})`);
  });
  
  console.log('\nDeleting...');
  
  // Delete them
  const { error: deleteError } = await supabase
    .from('loans')
    .delete()
    .or(`cast_hash.in.(${testCastHashes.join(',')}),borrower_fid.in.(${testFids.join(',')})`);
  
  if (deleteError) {
    console.error('Error deleting loans:', deleteError);
    return;
  }
  
  console.log('✅ Test loans deleted successfully\n');
  
  // Clean up any related funding intents
  if (loansToDelete.length > 0) {
    const loanIds = loansToDelete.map(l => l.id);
    
    const { error: intentError } = await supabase
      .from('funding_intents')
      .delete()
      .in('loan_id', loanIds);
    
    if (!intentError) {
      console.log('✅ Related funding intents cleaned\n');
    }
  }
  
  // Show remaining loans
  const { data: remainingLoans, error: remainingError } = await supabase
    .from('loans')
    .select('id, borrower_fid, status, gross_usdc')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (remainingLoans && remainingLoans.length > 0) {
    console.log('Remaining loans in system:');
    remainingLoans.forEach(loan => {
      console.log(`  - FID ${loan.borrower_fid}: $${loan.gross_usdc} (${loan.status})`);
    });
  } else {
    console.log('✅ No loans remaining - system is completely clean!');
  }
  
  console.log('\n🎨 Ready for Solienne\'s historic first loan!');
}

deleteSpecificLoans().catch(console.error);