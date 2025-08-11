#!/usr/bin/env node

const fetch = require('node-fetch')

async function testLoansAPI() {
  console.log('🔍 Testing /api/loans endpoint\n')
  
  const baseUrl = 'https://loancast.app'
  
  try {
    console.log(`Fetching: ${baseUrl}/api/loans`)
    const response = await fetch(`${baseUrl}/api/loans`)
    
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()))
    
    const data = await response.json()
    
    console.log(`\nResponse body:`)
    console.log(JSON.stringify(data, null, 2))
    
    if (Array.isArray(data)) {
      console.log(`\n✅ Returned ${data.length} loans`)
    } else if (data.loans && Array.isArray(data.loans)) {
      console.log(`\n✅ Returned ${data.loans.length} loans in 'loans' property`)
    } else {
      console.log('\n⚠️ Unexpected response format')
    }
    
  } catch (error) {
    console.error('❌ Error calling API:', error.message)
  }
}

testLoansAPI()