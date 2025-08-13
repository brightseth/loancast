#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRepaymentReadiness() {
  console.log('🔍 REPAYMENT SYSTEM READINESS CHECK')
  console.log('===================================\n')

  try {
    // Find the loan with cast hash containing aab8ad
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .ilike('cast_hash', '%aab8ad%')
    
    if (!loans || loans.length === 0) {
      console.log('❌ Could not find loan with cast hash containing aab8ad')
      return
    }
    
    const loan = loans[0]
    console.log('📋 LOAN DETAILS:')
    console.log('================')
    console.log(`Loan ID: ${loan.id}`)
    console.log(`Cast Hash: ${loan.cast_hash}`)
    console.log(`Status: ${loan.status} ${loan.status === 'funded' ? '✅' : '❌'}`)
    console.log(`Borrower: FID ${loan.borrower_fid} (you)`)
    console.log(`Lender: FID ${loan.lender_fid} (henry)`)
    console.log(`Amount funded: $${loan.gross_usdc}`)
    console.log(`Amount to repay: $${loan.repay_usdc} ${loan.repay_usdc ? '✅' : '❌'}`)
    console.log(`Due date: ${loan.due_ts}`)
    
    console.log('\n🔧 REPAYMENT REQUIREMENTS:')
    console.log('==========================')
    
    // Check wallet addresses
    console.log(`Borrower wallet: ${loan.borrower_addr || 'NOT SET'} ${loan.borrower_addr ? '✅' : '❌'}`)
    console.log(`Lender wallet: ${loan.lender_addr || 'NOT SET'} ${loan.lender_addr ? '✅' : '❌'}`)
    
    // Check repayment_intents table
    const { data: intentTest, error: intentError } = await supabase
      .from('repayment_intents')
      .select('*')
      .limit(1)
    
    console.log(`Repayment intents table: ${intentError ? 'MISSING' : 'EXISTS'} ${intentError ? '❌' : '✅'}`)
    
    if (intentError) {
      console.log(`   Error: ${intentError.message}`)
    }
    
    // Test API schema validation
    console.log('\n🧪 TESTING API ENDPOINTS:')
    console.log('==========================')
    
    // Check if loan can be processed by repayment init
    let canRepay = true
    const issues = []
    
    if (!['funded', 'due', 'overdue'].includes(loan.status)) {
      canRepay = false
      issues.push(`Loan status '${loan.status}' not valid for repayment`)
    }
    
    if (!loan.repay_usdc) {
      canRepay = false  
      issues.push('No repayment amount calculated')
    }
    
    // Wallet addresses are checked during API call, not required in DB
    console.log(`Loan status check: ${canRepay ? 'PASS' : 'FAIL'} ${canRepay ? '✅' : '❌'}`)
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:')
      issues.forEach(issue => console.log(`   - ${issue}`))
    }
    
    console.log('\n📝 REPAYMENT FLOW:')
    console.log('==================')
    console.log('1. User clicks "REPAY THIS LOAN" button')
    console.log('2. Frontend calls POST /api/repay/[loanId]/init with wallet addresses')
    console.log('3. API returns payment target and amount')
    console.log('4. User sends USDC on-chain to lender wallet')
    console.log('5. User calls POST /api/repay/[loanId]/confirm with tx hash')
    console.log('6. API verifies transaction and marks loan as repaid')
    
    console.log('\n🎯 RECOMMENDATION:')
    console.log('==================')
    if (canRepay) {
      console.log('✅ Loan is ready for repayment!')
      console.log(`   Amount due: $${loan.repay_usdc}`)
      console.log('   You can proceed with testing the repayment flow')
    } else {
      console.log('❌ Loan has issues that need fixing before repayment')
    }
    
    // Check what wallet addresses would be needed
    console.log('\n💳 WALLET REQUIREMENTS:')
    console.log('=======================')
    console.log('During repayment, you will need to provide:')
    console.log('- Your wallet address (borrower)')
    console.log('- Henry\'s wallet address (lender)')
    console.log('- Both addresses must match what was used during funding')
    
    return loan
    
  } catch (error) {
    console.error('❌ Error checking repayment readiness:', error)
  }
}

checkRepaymentReadiness()