#!/usr/bin/env node

// Apply the correction to Henry's loan in the database
async function applyCorrection() {
  const API_URL = 'https://loancast.app/api/admin/correct-loan-amounts'
  
  const correctionData = {
    loanId: '9abed685-639c-44ce-b811-c83e897d94dd',
    actualLoanAmount: 100,    // Your bid
    actualRepayAmount: 102    // Principal + 2%
  }
  
  console.log('Applying correction to database...')
  console.log('Loan:', correctionData.loanId)
  console.log('Actual loan amount: $' + correctionData.actualLoanAmount)
  console.log('Actual repayment: $' + correctionData.actualRepayAmount)
  console.log('')
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(correctionData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ SUCCESS! Database updated')
      console.log('Details:', result.loan)
    } else {
      console.error('❌ Failed:', result.error)
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

applyCorrection()