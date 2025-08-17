#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSchemas() {
  console.log('🔍 Checking table schemas...\n');

  // Check loans table
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .limit(1);

  if (loans && loans[0]) {
    console.log('📋 LOANS table columns:');
    console.log(Object.keys(loans[0]).join(', '));
  }

  // Check bids table
  const { data: bids, error: bidsError } = await supabase
    .from('bids')
    .select('*')
    .limit(1);

  if (bids && bids[0]) {
    console.log('\n💰 BIDS table columns:');
    console.log(Object.keys(bids[0]).join(', '));
  } else {
    console.log('\n💰 BIDS table: No records found, checking with empty insert...');
    
    // Try inserting empty record to see error
    const { error } = await supabase
      .from('bids')
      .insert({})
      .select();
    
    if (error) {
      console.log('Error details:', error);
    }
  }
}

checkSchemas().catch(console.error);