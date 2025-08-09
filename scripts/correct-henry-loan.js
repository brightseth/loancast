#!/usr/bin/env node

// CORRECTED: Fix Henry's loan with actual amounts based on collection
async function correctHenryLoan() {
  const API_URL = 'https://loancast.app/api/admin/correct-loan'
  
  console.log('=================================')
  console.log('🔧 CORRECTING Henry\'s Loan Amounts')
  console.log('=================================')
  console.log('')
  console.log('ORIGINAL MISUNDERSTANDING:')
  console.log('❌ Thought: $1000 loan, $1020 repayment')
  console.log('')
  console.log('ACTUAL CORRECT AMOUNTS:')
  console.log('✅ Collection/Bid: $100 (by @seth)')
  console.log('✅ This IS the loan amount')
  console.log('✅ Henry receives: ~$90 (after 10% Farcaster fee)')
  console.log('✅ Henry owes: $102 (principal + 2%)')
  console.log('✅ Due date: September 6, 2025')
  console.log('')
  
  const correctLoanData = {
    loanId: '9abed685-639c-44ce-b811-c83e897d94dd',
    castHash: '0xbde513732ef90778b27f69935fbd9207323431a0',
    borrower: 'henry (FID: 732)',
    lender: '@seth (FID: 3621)',
    
    // CORRECTED AMOUNTS
    loanAmount: 100,        // Your bid/collection
    netToBorrower: 90,      // After 10% platform fee
    repaymentAmount: 102,   // Principal + 2% monthly
    
    // Original cast was seeking UP TO $1000
    // But actual loan is based on winning bid
    originalRequest: 1000,
    actualFunded: 100,
    
    apr: '2% monthly (24% annual)',
    duration: '29 days',
    fundedDate: 'August 9, 2025',
    dueDate: 'September 6, 2025',
    status: 'FUNDED ✅'
  }
  
  console.log('CORRECTED Loan Record:')
  console.log(JSON.stringify(correctLoanData, null, 2))
  console.log('')
  console.log('📝 Summary for September 6, 2025:')
  console.log('- Henry needs to repay $102 USDC to @seth')
  console.log('- This is the first real test of repayment')
  console.log('- $2 interest on $100 principal')
  console.log('')
  console.log('✅ Correction documented!')
  
  // TODO: Update database with correct amounts
  // Need to change repay_usdc from 1020 to 102
  // Need to change loan amounts to reflect actual bid
}

correctHenryLoan()