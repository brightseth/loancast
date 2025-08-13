#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fix3DollarSettlement() {
  console.log('🔧 Fixing $3 Settlement for $1000 Loan\n')
  
  // Find the $1000 loan that should have settled for $3
  const loanId = '03b72a87-8404-4d84-b266-a6a7fd8affa8'
  
  console.log(`Updating loan: ${loanId}`)
  console.log('Current state: requested $1000 → funded $1000, status "open"')
  console.log('Correct state: requested $1000 → funded $3, status "funded"')
  
  // What should we update?
  const updates = {
    gross_usdc: 3,        // Actual amount funded
    net_usdc: 3,          // Assume no fees for now (can adjust if needed)
    status: 'funded',     // Mark as funded
    lender_fid: null,     // We need the lender FID - do you have it?
    funded_ts: new Date().toISOString(),  // When it was funded
    updated_at: new Date().toISOString()
  }
  
  // Also need to recalculate repayment amount based on $3 funded
  // 2% monthly on $3 = $3.06
  updates.repay_usdc = 3.06
  
  console.log('\nUpdates to apply:')
  console.log('================')
  Object.entries(updates).forEach(([key, value]) => {
    console.log(`${key}: ${value}`)
  })
  
  // Ask for confirmation before updating
  console.log('\n⚠️  This will update the loan settlement in the database.')
  console.log('Do you want to proceed? (You need to provide the lender FID)')
  console.log('\nTo proceed manually:')
  console.log('1. Provide the lender FID who funded $3')
  console.log('2. Confirm if there are any fees (net amount)')
  console.log('3. Provide transaction hash if available')
  
  // Don't auto-execute, wait for confirmation with more details
  console.log('\n📋 SQL to execute once you provide lender FID:')
  console.log(`
UPDATE loans 
SET 
  gross_usdc = 3,
  net_usdc = 3,
  status = 'funded',
  lender_fid = [LENDER_FID],
  repay_usdc = 3.06,
  funded_ts = NOW(),
  updated_at = NOW()
WHERE id = '${loanId}';
  `)
  
  console.log('🎯 This will show the correct funding metrics:')
  console.log('- Total requested: $1889 (unchanged)')
  console.log('- Total funded: $892 (was $1889, now reflects $3 settlement)')
  console.log('- Funding efficiency: Much more realistic!')
}

fix3DollarSettlement()