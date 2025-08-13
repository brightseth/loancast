#!/usr/bin/env node

// Test exactly what the frontend is doing

async function testFrontendAPI() {
  console.log('🔍 Testing Frontend API Call\n')
  
  // Use node's built-in fetch (Node 18+)
  try {
    console.log('Simulating frontend fetch("/api/loans")...')
    const response = await fetch('https://loancast.app/api/loans', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; LoanCast Debug)'
      }
    })
    
    console.log(`Response status: ${response.status}`)
    console.log(`Response headers:`, {
      'content-type': response.headers.get('content-type'),
      'cache-control': response.headers.get('cache-control'),
      'x-vercel-cache': response.headers.get('x-vercel-cache')
    })
    
    const data = await response.json()
    console.log(`\nResponse type: ${typeof data}`)
    console.log(`Is array: ${Array.isArray(data)}`)
    
    if (Array.isArray(data)) {
      console.log(`✅ Array with ${data.length} items`)
      
      // Simulate frontend logic exactly
      const loans = data
      const funded = loans.filter(loan => loan.status === 'funded')
      const totalVolume = funded.reduce((sum, loan) => sum + (loan.gross_usdc || 0), 0)
      
      const stats = {
        totalLoans: loans.length,
        totalFunded: funded.length,
        totalVolume
      }
      
      console.log('\n📊 Calculated stats:')
      console.log(`Total loans: ${stats.totalLoans}`)
      console.log(`Funded loans: ${stats.totalFunded}`)
      console.log(`Total volume: $${stats.totalVolume}`)
      
      console.log('\n💡 Homepage should show:')
      console.log(`"${stats.totalFunded > 0 ? `$${stats.totalVolume.toLocaleString()} funded • ` : ''}${stats.totalLoans} loan${stats.totalLoans === 1 ? '' : 's'} created"`)
      
    } else {
      console.log('❌ Not an array:', data)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Check if we're in Node 18+ with native fetch
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch...')
  const fetch = require('node-fetch')
  global.fetch = fetch
}

testFrontendAPI()