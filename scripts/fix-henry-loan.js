#!/usr/bin/env node

// Fix Henry's loan - mark as funded via cast collection
async function fixHenryLoan() {
  const API_URL = 'https://loancast.app/api/webhooks/cast-collection'
  
  // Henry's loan details from the database
  const loanData = {
    loanId: '9abed685-639c-44ce-b811-c83e897d94dd',
    collectorFid: 3621, // Seth's FID (you mentioned you collected it)
    collectionAmount: 100 // $100 collection
  }
  
  console.log('=================================')
  console.log('🔧 Fixing Henry\'s Loan')
  console.log('=================================')
  console.log('Loan ID:', loanData.loanId)
  console.log('Borrower FID: 732 (Henry)')
  console.log('Collector FID:', loanData.collectorFid, '(Seth)')
  console.log('Collection Amount: $' + loanData.collectionAmount)
  console.log('Repayment Due: 1020 USDC')
  console.log('Due Date: Sep 7, 2025')
  console.log('')
  console.log('Marking as funded...')
  
  try {
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loanData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('')
      console.log('✅ SUCCESS!')
      console.log('Message:', result.message)
      console.log('')
      console.log('Next steps:')
      console.log('1. Henry should receive notification of funding')
      console.log('2. You should receive lender notification')
      console.log('3. Loan status is now "funded"')
      console.log('4. Repayment due Sep 7, 2025')
    } else {
      console.error('')
      console.error('❌ FAILED!')
      console.error('Error:', result.error)
      console.error('')
      console.error('Please check:')
      console.error('1. Is the API endpoint deployed?')
      console.error('2. Is the loan ID correct?')
      console.error('3. Check server logs for details')
    }
  } catch (error) {
    console.error('')
    console.error('❌ Network Error:', error.message)
    console.error('Could not reach the API')
  }
}

// Run the fix
fixHenryLoan()