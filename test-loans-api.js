#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testLoansAPI() {
  console.log('🔍 Testing loans API query logic...\n')
  
  try {
    // 1. Test the exact query from the API (excludes deleted loans)
    console.log('1. API Query (excludes deleted loans):')
    let query = supabaseAdmin
      .from('loans')
      .select(`
        id,
        loan_number,
        cast_hash,
        borrower_fid,
        lender_fid,
        gross_usdc,
        net_usdc,
        yield_bps,
        repay_usdc,
        start_ts,
        due_ts,
        listing_deleted_at,
        status,
        tx_fund,
        tx_repay,
        created_at,
        updated_at
      `)
      .is('listing_deleted_at', null) // Exclude deleted loans

    const { data: apiLoans, error: apiError } = await query
      .order('created_at', { ascending: false })
      .limit(20)

    if (apiError) {
      console.error('   ❌ Error:', apiError.message)
    } else {
      console.log(`   📊 API would return ${apiLoans.length} loans`)
      apiLoans.forEach((loan, index) => {
        console.log(`   ${index + 1}. ${loan.id} | Cast: ${loan.cast_hash} | FID: ${loan.borrower_fid} | Status: ${loan.status}`)
      })
    }

    // 2. Test with include_deleted=true to see all loans
    console.log('\n2. Query with include_deleted=true (shows all loans):')
    const { data: allLoans, error: allError } = await supabaseAdmin
      .from('loans')
      .select(`
        id,
        cast_hash,
        borrower_fid,
        status,
        listing_deleted_at,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (allError) {
      console.error('   ❌ Error:', allError.message)
    } else {
      console.log(`   📊 Total loans in database: ${allLoans.length}`)
      allLoans.forEach((loan, index) => {
        const deletedStatus = loan.listing_deleted_at ? '🗑️ Deleted' : '✅ Active'
        console.log(`   ${index + 1}. ${loan.id} | Cast: ${loan.cast_hash} | FID: ${loan.borrower_fid} | ${deletedStatus}`)
      })
    }

    // 3. Summary
    console.log('\n3. Summary:')
    const activeCount = allLoans ? allLoans.filter(loan => !loan.listing_deleted_at).length : 0
    const deletedCount = allLoans ? allLoans.filter(loan => loan.listing_deleted_at).length : 0
    
    console.log(`   📊 Active loans (API will return): ${activeCount}`)
    console.log(`   📊 Deleted loans (API filters out): ${deletedCount}`)
    console.log(`   📊 Total loans in database: ${activeCount + deletedCount}`)

    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Loans API Test\n')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  console.log(`🔑 Using service key: ${supabaseServiceKey.substring(0, 20)}...\n`)
  
  await testLoansAPI()
  
  console.log('\n✅ API test completed!')
}

if (require.main === module) {
  main().catch(console.error)
}