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

async function checkDatabase() {
  console.log('🔍 Checking database state...\n')
  
  try {
    // Check if listing_deleted_at column exists by trying to query it
    console.log('1. Testing if listing_deleted_at column exists...')
    const { data: testData, error: testError } = await supabase
      .from('loans')
      .select('id, listing_deleted_at')
      .limit(1)
    
    if (testError) {
      if (testError.message.includes('column "listing_deleted_at" does not exist')) {
        console.log('   ❌ listing_deleted_at column does NOT exist')
        console.log('\n🔧 MIGRATION NEEDED:')
        console.log('   Please run the following SQL in your Supabase SQL Editor:')
        console.log('   \n   -- Add the column')
        console.log('   ALTER TABLE loans ADD COLUMN listing_deleted_at TIMESTAMPTZ;')
        console.log('   \n   -- Create index for performance')
        console.log('   CREATE INDEX idx_loans_listing_deleted_at ON loans(listing_deleted_at) WHERE listing_deleted_at IS NOT NULL;')
        console.log('\n   Or you can run: cat add-listing-deleted-at.sql | (copy and paste into Supabase SQL Editor)')
        return false
      } else {
        console.error('   ❌ Unexpected error:', testError.message)
        return false
      }
    } else {
      console.log('   ✅ listing_deleted_at column EXISTS')
    }

    // Get all loans to check current state
    console.log('\n2. Fetching all loans...')
    const { data: allLoans, error: loansError } = await supabase
      .from('loans')
      .select('id, cast_hash, borrower_fid, status, listing_deleted_at, created_at')
      .order('created_at', { ascending: false })
    
    if (loansError) {
      console.error('   ❌ Error fetching loans:', loansError.message)
      return false
    }
    
    console.log(`   📊 Total loans in database: ${allLoans.length}`)
    
    const deletedLoans = allLoans.filter(loan => loan.listing_deleted_at !== null)
    const activeLoans = allLoans.filter(loan => loan.listing_deleted_at === null)
    
    console.log(`   📊 Active loans (listing_deleted_at IS NULL): ${activeLoans.length}`)
    console.log(`   📊 Deleted loans (listing_deleted_at IS NOT NULL): ${deletedLoans.length}`)

    // Check specific loan ID
    const targetLoanId = "9abed685-639c-44ce-b811-c83e897d94dd"
    console.log(`\n3. Checking specific loan: ${targetLoanId}`)
    
    const targetLoan = allLoans.find(loan => loan.id === targetLoanId)
    if (targetLoan) {
      console.log('   ✅ Loan found:')
      console.log(`   📄 ID: ${targetLoan.id}`)
      console.log(`   📄 Status: ${targetLoan.status}`)
      console.log(`   📄 listing_deleted_at: ${targetLoan.listing_deleted_at || 'NULL'}`)
      console.log(`   📄 Cast Hash: ${targetLoan.cast_hash}`)
      
      if (targetLoan.listing_deleted_at) {
        console.log('   ✅ This loan IS marked as deleted (should be filtered out by API)')
      } else {
        console.log('   ⚠️  This loan is NOT marked as deleted (will appear in API results)')
      }
    } else {
      console.log('   ❌ Loan not found in database')
    }

    // Show all loans for debugging
    console.log('\n4. All loans summary:')
    allLoans.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.id}`)
      console.log(`      Status: ${loan.status}`)
      console.log(`      Deleted: ${loan.listing_deleted_at ? '✅ ' + loan.listing_deleted_at : '❌ NULL'}`)
      console.log(`      FID: ${loan.borrower_fid}`)
      console.log(`      Created: ${loan.created_at}`)
      console.log('')
    })

    // Test API filtering logic
    console.log('5. Simulating API filtering (loans with listing_deleted_at IS NULL)...')
    const apiFilteredLoans = allLoans.filter(loan => loan.listing_deleted_at === null)
    console.log(`   📊 Loans that would be returned by API: ${apiFilteredLoans.length}`)
    
    if (apiFilteredLoans.length > 0) {
      apiFilteredLoans.forEach((loan, index) => {
        console.log(`   ${index + 1}. ${loan.id} | Status: ${loan.status} | FID: ${loan.borrower_fid}`)
      })
    }

    // Show API endpoint info
    console.log('\n6. API Endpoint Test:')
    console.log(`   🌐 Test with: curl "${process.env.NEXT_PUBLIC_APP_URL}/api/loans"`)
    console.log(`   📝 Expected result: ${apiFilteredLoans.length} loans`)
    
    return true
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Database Verification Script')
  console.log('🎯 Checking listing_deleted_at column and loan filtering\n')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  console.log(`🔑 Using service key: ${supabaseServiceKey.substring(0, 20)}...\n`)
  
  await checkDatabase()
  
  console.log('\n✅ Database check completed!')
  console.log('\n💡 Next steps if column is missing:')
  console.log('   1. Open Supabase Dashboard > SQL Editor')
  console.log('   2. Copy and paste the SQL from add-listing-deleted-at.sql')
  console.log('   3. Run this script again to verify')
}

if (require.main === module) {
  main().catch(console.error)
}