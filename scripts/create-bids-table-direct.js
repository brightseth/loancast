#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function createBidsTable() {
  console.log('🗃️ Creating Bids Table Directly\n')
  
  // Create the table with a simple SQL command
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS bids (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
      bidder_fid BIGINT NOT NULL,
      bid_amount NUMERIC(18,2) NOT NULL,
      bid_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      bid_sequence INTEGER,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'winning', 'losing')),
      cast_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
  
  try {
    console.log('1️⃣ Creating bids table...')
    
    // Use a raw query approach through the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    })
    
    if (!response.ok) {
      console.log('Direct SQL execution not available, using alternative approach...')
      
      // Alternative: Let's just provide the SQL for manual execution
      console.log('📋 Please execute this SQL manually in Supabase dashboard:')
      console.log('=' .repeat(60))
      console.log(createTableSQL)
      console.log('=' .repeat(60))
      
      // Also create the indexes
      console.log('\n📋 Then add these indexes:')
      console.log(`
CREATE INDEX IF NOT EXISTS idx_bids_loan_id ON bids(loan_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_fid ON bids(bidder_fid);  
CREATE INDEX IF NOT EXISTS idx_bids_amount ON bids(bid_amount DESC);
CREATE INDEX IF NOT EXISTS idx_bids_timestamp ON bids(bid_timestamp DESC);

-- Unique constraint for active bids
CREATE UNIQUE INDEX IF NOT EXISTS idx_bids_unique_active ON bids(loan_id, bidder_fid) 
WHERE status = 'active';
      `)
      
      console.log('\n🎯 Manual Steps:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Open your LoanCast project')
      console.log('3. Go to SQL Editor')
      console.log('4. Copy and run the SQL above')
      
    } else {
      console.log('✅ Table created successfully!')
    }
    
  } catch (error) {
    console.log('❌ Error creating table:', error.message)
    console.log('\n📋 Please create the table manually with this SQL:')
    console.log('=' .repeat(60))
    console.log(createTableSQL)
    console.log('=' .repeat(60))
  }
  
  // Test if we can insert a sample bid
  console.log('\n🧪 Testing bid insertion...')
  
  try {
    const { data, error } = await supabase
      .from('bids')
      .insert({
        loan_id: '03b72a87-8404-4d84-b266-a6a7fd8affa8', // Use the existing loan ID
        bidder_fid: 5046, // Henry's FID
        bid_amount: 3.00,
        bid_timestamp: new Date().toISOString(),
        status: 'winning',
        cast_hash: 'test_cast_hash'
      })
      .select()
      .single()
    
    if (error) {
      console.log('❌ Could not insert test bid:', error.message)
      if (error.message.includes('relation "bids" does not exist')) {
        console.log('👆 Table needs to be created first')
      }
    } else {
      console.log('✅ Test bid inserted successfully!')
      console.log('📊 Bid ID:', data.id)
      
      // Clean up test bid
      await supabase.from('bids').delete().eq('id', data.id)
      console.log('🧹 Test bid removed')
    }
    
  } catch (testError) {
    console.log('❌ Test failed:', testError.message)
  }
}

createBidsTable()