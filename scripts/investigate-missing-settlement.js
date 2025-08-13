#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function investigateMissingSettlement() {
  console.log('🔍 Investigating Missing $3 Settlement\n')
  
  // 1. Check all loans in detail
  console.log('📋 All Loans in Database:')
  console.log('==========================')
  
  const { data: allLoans, error } = await supabase
    .from('loans')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching loans:', error)
    return
  }
  
  console.log(`Found ${allLoans.length} loans total\n`)
  
  allLoans.forEach((loan, index) => {
    console.log(`--- Loan #${index + 1} ---`)
    console.log(`ID: ${loan.id}`)
    console.log(`Loan Number: ${loan.loan_number || 'N/A'}`)
    console.log(`Cast Hash: ${loan.cast_hash}`)
    console.log(`Borrower FID: ${loan.borrower_fid}`)
    console.log(`Lender FID: ${loan.lender_fid || 'N/A'}`)
    console.log(`Status: ${loan.status}`)
    console.log(`Requested: $${loan.requested_usdc || loan.gross_usdc || 'N/A'}`)
    console.log(`Funded (gross): $${loan.gross_usdc || 'N/A'}`)
    console.log(`Net: $${loan.net_usdc || 'N/A'}`)
    console.log(`Repay Amount: $${loan.repay_usdc || 'N/A'}`)
    console.log(`TX Fund: ${loan.tx_fund || 'N/A'}`)
    console.log(`TX Repay: ${loan.tx_repay || 'N/A'}`)
    console.log(`Created: ${loan.created_at}`)
    console.log(`Updated: ${loan.updated_at}`)
    console.log('')
  })
  
  // 2. Look for transactions or repayments that might indicate the $3 settlement
  console.log('💸 Checking Repayments Table:')
  console.log('=============================')
  
  const { data: repayments, error: repayError } = await supabase
    .from('repayments')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (repayError) {
    console.log('❌ Error fetching repayments:', repayError)
  } else if (repayments && repayments.length > 0) {
    repayments.forEach(repayment => {
      console.log(`Repayment ID: ${repayment.id}`)
      console.log(`Loan ID: ${repayment.loan_id}`)
      console.log(`Amount: $${repayment.amount_usdc}`)
      console.log(`TX Hash: ${repayment.tx_hash}`)
      console.log(`Created: ${repayment.created_at}`)
      console.log('')
    })
  } else {
    console.log('No repayments found in database\n')
  }
  
  // 3. Look for specific $3 amounts
  console.log('🔍 Looking for $3 Amounts:')
  console.log('==========================')
  
  const loansWithThree = allLoans.filter(loan => 
    loan.gross_usdc === 3 || 
    loan.net_usdc === 3 || 
    loan.repay_usdc === 3 ||
    loan.requested_usdc === 3
  )
  
  if (loansWithThree.length > 0) {
    console.log(`Found ${loansWithThree.length} loans with $3 amounts:`)
    loansWithThree.forEach(loan => {
      console.log(`- ${loan.id}: status=${loan.status}, gross=$${loan.gross_usdc}, net=$${loan.net_usdc}`)
    })
  } else {
    console.log('❌ No loans found with $3 amounts')
  }
  
  // 4. Check for potential data inconsistencies
  console.log('\n⚠️  Potential Issues:')
  console.log('======================')
  
  allLoans.forEach(loan => {
    const issues = []
    
    if (loan.status === 'open' && loan.lender_fid) {
      issues.push('Status is "open" but has lender_fid')
    }
    
    if (loan.status === 'funded' && !loan.lender_fid) {
      issues.push('Status is "funded" but no lender_fid')
    }
    
    if (loan.gross_usdc && loan.requested_usdc && loan.gross_usdc !== loan.requested_usdc) {
      issues.push(`Funding mismatch: requested $${loan.requested_usdc} vs funded $${loan.gross_usdc}`)
    }
    
    if (issues.length > 0) {
      console.log(`\nLoan ${loan.id.substring(0, 8)}... issues:`)
      issues.forEach(issue => console.log(`  - ${issue}`))
    }
  })
  
  console.log('\n🎯 Summary for $3 Settlement Investigation:')
  console.log('============================================')
  console.log('If a loan settled for $3, we should see:')
  console.log('1. A loan with gross_usdc = 3')
  console.log('2. Status should be "funded" (not "open")')
  console.log('3. Should have a lender_fid')
  console.log('4. Might have a transaction hash in tx_fund')
  
  const suspectLoan = allLoans.find(loan => 
    (loan.requested_usdc > 100 && loan.gross_usdc < 10) || // Big request, tiny funding
    (loan.status === 'open' && loan.lender_fid) // Status inconsistency
  )
  
  if (suspectLoan) {
    console.log('\n🚨 SUSPECT LOAN FOUND:')
    console.log(`Loan ${suspectLoan.id} might be the $3 settlement that\'s not showing properly`)
  } else {
    console.log('\n❓ No obvious $3 settlement found in database')
    console.log('The $3 settlement might be:')
    console.log('- In a different system/database')
    console.log('- Not yet recorded in the loans table')
    console.log('- Recorded with different amount values')
  }
}

investigateMissingSettlement()