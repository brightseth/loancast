#!/usr/bin/env node

/**
 * Clean up test agent loans from database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function cleanupTestLoans() {
  console.log('🧹 CLEANING UP TEST AGENT LOANS');
  console.log('════════════════════════════════════════\n');
  
  // Test agent FIDs
  const TEST_AGENT_FIDS = [999001, 999002, 999003, 999004, 999005];
  
  // Find all test loans
  const { data: testLoans, error: fetchError } = await supabase
    .from('loans')
    .select('id, borrower_fid, lender_fid, cast_hash, gross_usdc, status, description')
    .or(`borrower_fid.in.(${TEST_AGENT_FIDS.join(',')}),lender_fid.in.(${TEST_AGENT_FIDS.join(',')}),cast_hash.like.agent_test_%,cast_hash.like.agent_auto_%,cast_hash.like.agent_bid_%`);

  if (fetchError) {
    console.error('❌ Error fetching test loans:', fetchError);
    return;
  }

  if (!testLoans || testLoans.length === 0) {
    console.log('✅ No test loans found');
    return;
  }

  console.log(`📋 Found ${testLoans.length} test loans to clean up:\n`);
  
  // Display loans to be deleted
  for (const loan of testLoans) {
    console.log(`  🗑️  Loan ID: ${loan.id.slice(0,8)}...`);
    console.log(`     Amount: ${loan.gross_usdc} USDC`);
    console.log(`     Status: ${loan.status}`);
    console.log(`     Cast: ${loan.cast_hash}`);
    console.log(`     Description: ${loan.description || 'N/A'}`);
    console.log('');
  }

  // Confirm deletion
  console.log('🚮 Deleting test loans and associated bids...\n');

  let bidsDeleted = 0;
  let loansDeleted = 0;

  // Delete associated bids first
  for (const loan of testLoans) {
    const { data: bids, error: bidFetchError } = await supabase
      .from('bids')
      .select('id')
      .eq('loan_id', loan.id);

    if (!bidFetchError && bids && bids.length > 0) {
      const { error: bidError } = await supabase
        .from('bids')
        .delete()
        .eq('loan_id', loan.id);
      
      if (bidError) {
        console.error(`❌ Error deleting bids for loan ${loan.id}:`, bidError);
      } else {
        bidsDeleted += bids.length;
        console.log(`  ✅ Deleted ${bids.length} bid(s) for loan ${loan.id.slice(0,8)}...`);
      }
    }
  }

  // Delete the test loans
  const { error: deleteError } = await supabase
    .from('loans')
    .delete()
    .or(`borrower_fid.in.(${TEST_AGENT_FIDS.join(',')}),lender_fid.in.(${TEST_AGENT_FIDS.join(',')}),cast_hash.like.agent_test_%,cast_hash.like.agent_auto_%,cast_hash.like.agent_bid_%`);

  if (deleteError) {
    console.error('❌ Error deleting test loans:', deleteError);
    return;
  }

  loansDeleted = testLoans.length;

  console.log('\n✅ CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`  Loans deleted: ${loansDeleted}`);
  console.log(`  Bids deleted: ${bidsDeleted}`);
  console.log(`  Database cleaned!`);

  // Verify cleanup
  const { data: remainingLoans } = await supabase
    .from('loans')
    .select('id')
    .or(`borrower_fid.in.(${TEST_AGENT_FIDS.join(',')}),lender_fid.in.(${TEST_AGENT_FIDS.join(',')})`);

  if (remainingLoans && remainingLoans.length > 0) {
    console.log(`\n⚠️  Warning: ${remainingLoans.length} test loans still remain`);
  } else {
    console.log('\n✅ All test loans successfully removed');
  }
}

cleanupTestLoans().catch(console.error);