#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSchema() {
  console.log('Checking bids table schema...\n');
  
  // Try to fetch bids
  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .limit(5);
  
  if (error) {
    console.log('Error fetching bids:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Found', data.length, 'bids');
    console.log('Columns:', Object.keys(data[0]));
    console.log('\nSample bid:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No bids found in table');
    console.log('The bids table might not exist or has different columns');
  }
}

checkSchema().catch(console.error);