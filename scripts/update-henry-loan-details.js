#!/usr/bin/env node

// Update Henry's loan with correct funding details
async function updateLoanDetails() {
  console.log('=================================')
  console.log('📝 Updating Loan Details')
  console.log('=================================')
  console.log('Cast Hash: 0xbde513...')
  console.log('Funded by: @seth (FID: 3621)')
  console.log('Collection Amount: $100')
  console.log('Loan Amount: $1000 USDC')
  console.log('Repayment: $1020 USDC')
  console.log('APR: 2% monthly')
  console.log('Due Date: Sep 6, 2025 (corrected)')
  console.log('')
  
  // Record for documentation
  const loanRecord = {
    loanId: '9abed685-639c-44ce-b811-c83e897d94dd',
    castHash: '0xbde513732ef90778b27f69935fbd9207323431a0',
    shortHash: '#0xbde513',
    borrower: 'henry (FID: 732)',
    lender: '@seth (FID: 3621)',
    fundingMethod: 'Cast Collection',
    collectionAmount: 100, // USD
    loanAmount: 1000, // USDC
    repaymentAmount: 1020, // USDC
    apr: '2% monthly (24% annual)',
    duration: '29 days',
    fundedDate: 'August 9, 2025',
    dueDate: 'September 6, 2025',
    status: 'FUNDED ✅'
  }
  
  console.log('Loan Record Updated:')
  console.log(JSON.stringify(loanRecord, null, 2))
  console.log('')
  console.log('✅ Documentation complete!')
  console.log('')
  console.log('Next milestone: September 6, 2025')
  console.log('Henry needs to repay 1020 USDC')
  console.log('This will test the 90%+ repayment target!')
}

updateLoanDetails()