#!/usr/bin/env node

// Script to manually mark Henry's loan as funded via cast collection
// Run with: node scripts/mark-henry-loan-funded.js

async function markLoanFunded() {
  const API_URL = 'https://loancast.app/api/webhooks/cast-collection'
  
  // Henry's loan details
  const loanData = {
    castHash: 'henry-loan-cast-hash', // You'll need to get the actual cast hash
    collectorFid: 'seth-fid', // Your FID as the collector
    collectionAmount: 100, // $100 collection
    transactionHash: 'collection-tx-hash', // Transaction hash if available
    timestamp: new Date().toISOString()
  }
  
  try {
    console.log('Marking Henry\'s loan as funded via cast collection...')
    console.log('Collection amount: $100')
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loanData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Success! Loan marked as funded:', result)
    } else {
      console.error('❌ Failed:', result.error)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// Alternative: Use the manual PUT endpoint with loan ID
async function markLoanFundedByID() {
  const API_URL = 'https://loancast.app/api/webhooks/cast-collection'
  
  // You need to find Henry's loan ID from the database
  // Based on the API response, the loan with 1020 USDC repayment
  const loanData = {
    loanId: 'HENRY_LOAN_ID', // Replace with actual ID
    collectorFid: 12345, // Your FID
    collectionAmount: 100
  }
  
  try {
    console.log('Manually marking loan as funded...')
    
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loanData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Success!', result.message)
    } else {
      console.error('❌ Failed:', result.error)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
console.log('Henry\'s Loan Collection Fix')
console.log('============================')
console.log('Loan: 1000 USDC, repay 1020 USDC')
console.log('Collection: $100 by Seth')
console.log('Due: Sep 7, 2025')
console.log('')

// Choose which method to use
// markLoanFunded() // If you have the cast hash
markLoanFundedByID() // If you have the loan ID