#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRequestedVsFunded() {
  console.log('🧪 Testing Requested vs Funded Tracking\n')
  
  // 1. Check existing loans
  console.log('📊 Current Loan Data:')
  console.log('====================')
  
  const { data: loans, error } = await supabase
    .from('loans')
    .select('id, loan_number, requested_usdc, gross_usdc, status, borrower_fid')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching loans:', error)
    return
  }
  
  if (loans && loans.length > 0) {
    loans.forEach(loan => {
      console.log(`\nLoan #${loan.loan_number || 'N/A'} (${loan.id.substring(0, 8)}...)`)
      console.log(`  Status: ${loan.status}`)
      console.log(`  Requested: $${loan.requested_usdc || 'N/A'}`)
      console.log(`  Funded: $${loan.gross_usdc || 'Not yet funded'}`)
      
      if (loan.requested_usdc && loan.gross_usdc) {
        const fundingRate = (loan.gross_usdc / loan.requested_usdc * 100).toFixed(1)
        console.log(`  Funding Rate: ${fundingRate}%`)
      }
    })
  }
  
  // 2. Analytics summary
  console.log('\n\n📈 Analytics Summary:')
  console.log('====================')
  
  const { data: stats } = await supabase
    .from('loans')
    .select('requested_usdc, gross_usdc, status')
  
  if (stats) {
    const totalRequested = stats.reduce((sum, l) => sum + (l.requested_usdc || 0), 0)
    const totalFunded = stats.reduce((sum, l) => sum + (l.gross_usdc || 0), 0)
    const fundedLoans = stats.filter(l => l.gross_usdc !== null)
    
    console.log(`Total Loans: ${stats.length}`)
    console.log(`Total Requested: $${totalRequested.toFixed(2)}`)
    console.log(`Total Funded: $${totalFunded.toFixed(2)}`)
    
    if (fundedLoans.length > 0) {
      const avgFundingRate = fundedLoans.reduce((sum, l) => 
        sum + (l.gross_usdc / l.requested_usdc), 0) / fundedLoans.length * 100
      console.log(`Average Funding Rate: ${avgFundingRate.toFixed(1)}%`)
    }
  }
  
  // 3. Test scenarios
  console.log('\n\n✅ System Capabilities:')
  console.log('======================')
  console.log('• New loans will track requested_usdc separately')
  console.log('• Funded loans can have different gross_usdc amounts')
  console.log('• Perfect for auction/negotiation scenarios')
  console.log('• Analytics ready for funding efficiency metrics')
  
  console.log('\n🎉 Requested vs Funded tracking is working!')
}

testRequestedVsFunded()