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
    // 1. Check if listing_deleted_at column exists
    console.log('1. Checking if listing_deleted_at column exists...')
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('execute', {
        query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'loans' 
            AND column_name = 'listing_deleted_at'
        `
      })
    
    if (columnError) {
      // Try alternative method using direct query
      const { data: columns, error: altError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', 'loans')
        .eq('column_name', 'listing_deleted_at')
      
      if (altError) {
        console.log('   Using direct table inspection method...')
        // Try to query the loans table directly to see if column exists
        const { data: testQuery, error: testError } = await supabase
          .from('loans')
          .select('listing_deleted_at')
          .limit(1)
        
        if (testError) {
          if (testError.message.includes('column "listing_deleted_at" does not exist')) {
            console.log('   ❌ listing_deleted_at column does NOT exist')
            console.log('   📝 Need to run migration: add-listing-deleted-at.sql\n')
            return false
          } else {
            console.error('   ❌ Error checking column:', testError.message)
            return false
          }
        } else {
          console.log('   ✅ listing_deleted_at column EXISTS (confirmed via query test)')
        }
      } else if (columns && columns.length > 0) {
        console.log('   ✅ listing_deleted_at column EXISTS')
        console.log('   📄 Column details:', columns[0])
      } else {
        console.log('   ❌ listing_deleted_at column does NOT exist')
        console.log('   📝 Need to run migration: add-listing-deleted-at.sql\n')
        return false
      }
    } else {
      console.log('   ✅ listing_deleted_at column EXISTS')
      if (columnInfo && columnInfo.length > 0) {
        console.log('   📄 Column details:', columnInfo[0])
      }
    }

    // 2. Get all loans to check current state
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

    // 3. Check specific loan ID
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

    // 4. Show all loans for debugging
    console.log('\n4. All loans summary:')
    allLoans.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.id} | Status: ${loan.status} | Deleted: ${loan.listing_deleted_at ? '✅' : '❌'} | FID: ${loan.borrower_fid}`)
    })

    // 5. Test API filtering logic
    console.log('\n5. Simulating API filtering...')
    const apiFilteredLoans = allLoans.filter(loan => loan.listing_deleted_at === null)
    console.log(`   📊 Loans that would be returned by API: ${apiFilteredLoans.length}`)
    apiFilteredLoans.forEach((loan, index) => {
      console.log(`   ${index + 1}. ${loan.id} | Status: ${loan.status} | FID: ${loan.borrower_fid}`)
    })

    return true
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message)
    return false
  }
}

async function runMigration() {
  console.log('\n🔧 Running migration to add listing_deleted_at column...')
  
  try {
    // Add the column if it doesn't exist
    const { error: alterError } = await supabase.rpc('execute', {
      query: 'ALTER TABLE loans ADD COLUMN IF NOT EXISTS listing_deleted_at TIMESTAMPTZ;'
    })
    
    if (alterError) {
      console.error('❌ Error adding column:', alterError.message)
      return false
    }
    
    console.log('✅ Column added successfully')
    
    // Create index
    const { error: indexError } = await supabase.rpc('execute', {
      query: 'CREATE INDEX IF NOT EXISTS idx_loans_listing_deleted_at ON loans(listing_deleted_at) WHERE listing_deleted_at IS NOT NULL;'
    })
    
    if (indexError) {
      console.error('⚠️  Warning: Could not create index:', indexError.message)
    } else {
      console.log('✅ Index created successfully')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Database Verification Script\n')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  console.log(`🔑 Using service key: ${supabaseServiceKey.substring(0, 20)}...\n`)
  
  const columnExists = await checkDatabase()
  
  if (!columnExists) {
    console.log('🔧 Column does not exist. Running migration...')
    const migrationSuccess = await runMigration()
    
    if (migrationSuccess) {
      console.log('✅ Migration completed. Re-checking database...')
      await checkDatabase()
    }
  }
  
  console.log('\n✅ Database check completed!')
}

if (require.main === module) {
  main().catch(console.error)
}