#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔧 Running migration to add listing_deleted_at column...\n')
  
  try {
    // First check if column already exists
    const { data: testData, error: testError } = await supabase
      .from('loans')
      .select('id, listing_deleted_at')
      .limit(1)
    
    if (!testError) {
      console.log('✅ Column already exists! No migration needed.')
      return true
    }
    
    if (!testError.message.includes('column "listing_deleted_at" does not exist')) {
      console.error('❌ Unexpected error:', testError.message)
      return false
    }

    console.log('📝 Column does not exist. Need to add it manually via Supabase Dashboard.\n')
    
    console.log('🎯 INSTRUCTIONS:')
    console.log('1. Go to https://supabase.com/dashboard/project/qvafjicbrsoyzdlgypuq/sql/new')
    console.log('2. Copy and paste this SQL:')
    console.log('\n------- SQL TO COPY -------')
    console.log('ALTER TABLE loans ADD COLUMN IF NOT EXISTS listing_deleted_at TIMESTAMPTZ;')
    console.log('CREATE INDEX IF NOT EXISTS idx_loans_listing_deleted_at ON loans(listing_deleted_at) WHERE listing_deleted_at IS NOT NULL;')
    console.log('SELECT \'Migration completed successfully\' AS status;')
    console.log('---------------------------\n')
    console.log('3. Click "Run" to execute the migration')
    console.log('4. Come back and run this script again to verify')
    
    return false
    
  } catch (error) {
    console.error('❌ Migration check failed:', error.message)
    return false
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...')
  
  try {
    // Test if column exists and get all loans
    const { data: allLoans, error: loansError } = await supabase
      .from('loans')
      .select('id, cast_hash, borrower_fid, status, listing_deleted_at, created_at')
      .order('created_at', { ascending: false })
    
    if (loansError) {
      if (loansError.message.includes('column "listing_deleted_at" does not exist')) {
        console.log('❌ Column still does not exist. Please run the migration first.')
        return false
      }
      console.error('❌ Error fetching loans:', loansError.message)
      return false
    }
    
    console.log('✅ Migration successful! Column exists.')
    console.log(`📊 Total loans: ${allLoans.length}`)
    
    const deletedLoans = allLoans.filter(loan => loan.listing_deleted_at !== null)
    const activeLoans = allLoans.filter(loan => loan.listing_deleted_at === null)
    
    console.log(`📊 Active loans: ${activeLoans.length}`)
    console.log(`📊 Deleted loans: ${deletedLoans.length}`)
    
    // Check specific loan
    const targetLoanId = "9abed685-639c-44ce-b811-c83e897d94dd"
    const targetLoan = allLoans.find(loan => loan.id === targetLoanId)
    
    if (targetLoan) {
      console.log(`\n🎯 Target loan ${targetLoanId}:`)
      console.log(`   Status: ${targetLoan.status}`)
      console.log(`   listing_deleted_at: ${targetLoan.listing_deleted_at || 'NULL'}`)
      
      if (targetLoan.listing_deleted_at) {
        console.log('   ✅ Marked as deleted - will be filtered out by API')
      } else {
        console.log('   ⚠️  Not marked as deleted - API will return it')
        console.log('   💡 You may need to trigger the webhook again to mark it as deleted')
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Migration Script for listing_deleted_at Column\n')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  console.log(`🔑 Using service key: ${supabaseServiceKey.substring(0, 20)}...\n`)
  
  const migrationNeeded = !(await runMigration())
  
  if (!migrationNeeded) {
    await verifyMigration()
    
    console.log('\n🎯 Next steps:')
    console.log('   1. Test API: curl "https://loancast.app/api/loans"')
    console.log('   2. If loan 9abed685-639c-44ce-b811-c83e897d94dd is still appearing,')
    console.log('      trigger the webhook again to mark it as deleted')
  }
}

if (require.main === module) {
  main().catch(console.error)
}