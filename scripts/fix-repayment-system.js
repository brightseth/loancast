#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRepaymentSystem() {
  console.log('🔧 FIXING REPAYMENT SYSTEM')
  console.log('==========================\n')

  try {
    // 1. Create repayment_intents table
    console.log('1️⃣ Creating repayment_intents table...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS repayment_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
        borrower_addr TEXT NOT NULL,
        lender_addr TEXT NOT NULL,
        expected_amount NUMERIC(18,6) NOT NULL,
        status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'confirmed', 'failed', 'expired')),
        tx_hash TEXT,
        verified_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(loan_id, status) DEFERRABLE INITIALLY DEFERRED
      );
      
      CREATE INDEX IF NOT EXISTS idx_repayment_intents_loan_id ON repayment_intents(loan_id);
      CREATE INDEX IF NOT EXISTS idx_repayment_intents_status ON repayment_intents(status);
      CREATE INDEX IF NOT EXISTS idx_repayment_intents_expires_at ON repayment_intents(expires_at);
    `
    
    // Since we can't execute SQL directly, provide it for manual execution
    console.log('⚠️  Please run this SQL in Supabase dashboard:')
    console.log('=' .repeat(80))
    console.log(createTableSQL)
    console.log('=' .repeat(80))
    
    // 2. Test if we can create a simple repayment intent
    console.log('\n2️⃣ Testing table creation...')
    
    const { data: testInsert, error: insertError } = await supabase
      .from('repayment_intents')
      .insert({
        loan_id: 'b6c98b1d-f440-4829-8d35-cdbffad43545',
        borrower_addr: '0x1234567890123456789012345678901234567890', // placeholder
        lender_addr: '0x0987654321098765432109876543210987654321',   // placeholder  
        expected_amount: '804.78',
        status: 'initiated',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      })
      .select()
      .single()
    
    if (insertError) {
      if (insertError.message.includes('does not exist')) {
        console.log('❌ Table still needs to be created manually')
        console.log('   Go to Supabase dashboard and run the SQL above')
      } else {
        console.log('❌ Insert error:', insertError.message)
      }
    } else {
      console.log('✅ Successfully created test repayment intent')
      console.log('   ID:', testInsert.id)
      
      // Clean up test data
      await supabase
        .from('repayment_intents')
        .delete()
        .eq('id', testInsert.id)
      
      console.log('✅ Test data cleaned up')
    }
    
    console.log('\n3️⃣ Wallet Address Strategy:')
    console.log('============================')
    console.log('The repayment API is designed to accept wallet addresses dynamically.')
    console.log('When you click "REPAY", the frontend will:')
    console.log('- Ask for your wallet address (borrower)')  
    console.log('- Ask for Henry\'s wallet address (lender)')
    console.log('- Send both to /api/repay/[loanId]/init')
    console.log('- API will validate and return payment instructions')
    
    console.log('\n🎯 NEXT STEPS:')
    console.log('==============')
    console.log('1. Run the SQL above in Supabase dashboard')
    console.log('2. Test the repayment flow end-to-end')
    console.log('3. You\'ll need both wallet addresses during repayment')
    console.log(`4. Amount to repay: $804.78 to Henry`)
    
  } catch (error) {
    console.error('❌ Error fixing repayment system:', error)
  }
}

fixRepaymentSystem()