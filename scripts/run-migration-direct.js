#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Running migration to add requested_usdc field...\n')
  
  console.log('📋 Migration SQL:')
  console.log('================')
  console.log(`
ALTER TABLE loans ADD COLUMN IF NOT EXISTS requested_usdc NUMERIC(18,2);

-- Update existing loans to set requested_usdc = gross_usdc for historical data
UPDATE loans SET requested_usdc = gross_usdc WHERE requested_usdc IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN loans.requested_usdc IS 'Original amount requested by borrower before auction/negotiation';
COMMENT ON COLUMN loans.gross_usdc IS 'Actual amount funded/settled after auction';
  `)
  
  console.log('\n⚠️  IMPORTANT: Since we cannot execute DDL directly via Supabase client,')
  console.log('you need to run the above SQL in one of these ways:\n')
  
  console.log('Option 1 - Supabase Dashboard:')
  console.log('1. Go to: https://supabase.com/dashboard/project/qvafjicbrsoyzdlgypuq/sql')
  console.log('2. Paste the SQL above')
  console.log('3. Click "Run"\n')
  
  console.log('Option 2 - Supabase CLI:')
  console.log('1. Install: npm install -g supabase')
  console.log('2. Run: supabase db execute --file supabase/migrations/add_requested_amount.sql\n')
  
  // Test if field already exists
  console.log('📊 Checking current table structure...')
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .limit(1)
  
  if (!error && data && data.length > 0) {
    const sampleLoan = data[0]
    if ('requested_usdc' in sampleLoan) {
      console.log('✅ Field already exists! Migration may have been run previously.')
      console.log('Sample loan data:', {
        id: sampleLoan.id,
        requested_usdc: sampleLoan.requested_usdc,
        gross_usdc: sampleLoan.gross_usdc
      })
    } else {
      console.log('❌ Field does not exist yet. Please run the migration SQL above.')
      console.log('Current fields:', Object.keys(sampleLoan))
    }
  }
}

runMigration()