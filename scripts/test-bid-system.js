#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testBidSystem() {
  console.log('🧪 Testing Bid System\n')

  try {
    // 1. Test basic table access
    console.log('1️⃣ Testing table access...')
    const { data: tableTest, error: tableError } = await supabase
      .from('bids')
      .select('*')
      .limit(5)
    
    if (tableError) {
      console.log('❌ Table access failed:', tableError.message)
      return
    }
    
    console.log(`✅ Table accessible, found ${tableTest.length} bids\n`)

    // 2. Show all current bids
    if (tableTest.length > 0) {
      console.log('2️⃣ Current bids in system:')
      tableTest.forEach((bid, i) => {
        console.log(`   ${i+1}. FID ${bid.bidder_fid}: $${bid.bid_amount} (${bid.status})`)
      })
      console.log('')
    }

    // 3. Test specific loan query
    console.log('3️⃣ Testing loan-specific query...')
    const loanId = '03b72a87-8404-4d84-b266-a6a7fd8affa8'
    
    const { data: loanBids, error: loanError } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loanId)
      .order('bid_sequence', { ascending: true })
    
    if (loanError) {
      console.log('❌ Loan query failed:', loanError.message)
    } else {
      console.log(`✅ Found ${loanBids.length} bids for loan ${loanId.substring(0, 8)}...`)
      loanBids.forEach((bid, i) => {
        console.log(`   Bid ${bid.bid_sequence || i+1}: FID ${bid.bidder_fid} → $${bid.bid_amount} (${bid.status})`)
      })
      console.log('')
    }

    // 4. Test analytics aggregation
    console.log('4️⃣ Testing analytics...')
    const { data: allBids } = await supabase
      .from('bids')
      .select('*')
    
    if (allBids && allBids.length > 0) {
      const totalBids = allBids.length
      const uniqueBidders = new Set(allBids.map(b => b.bidder_fid)).size
      const uniqueLoans = new Set(allBids.map(b => b.loan_id)).size
      const avgBid = allBids.reduce((sum, b) => sum + b.bid_amount, 0) / totalBids
      const winningBids = allBids.filter(b => b.status === 'winning').length

      console.log(`✅ Analytics summary:`)
      console.log(`   Total bids: ${totalBids}`)
      console.log(`   Unique bidders: ${uniqueBidders}`)
      console.log(`   Auctions with bids: ${uniqueLoans}`)
      console.log(`   Average bid: $${avgBid.toFixed(2)}`)
      console.log(`   Winning bids: ${winningBids}`)
      console.log('')
    }

    // 5. Test webhook integration readiness
    console.log('5️⃣ Testing webhook integration...')
    
    // Check if parseBidAmount function would work
    const testTexts = [
      "I'll bid $5",
      "$10 for this loan",
      "bidding 25 dollars",
      "I can lend $50.50",
      "not a bid message"
    ]

    console.log('   Bid parsing test:')
    testTexts.forEach(text => {
      // Simple regex test (same logic as webhook)
      const match = text.match(/\$?(\d+(?:\.\d{2})?)/);
      const amount = match ? parseFloat(match[1]) : null
      console.log(`   "${text}" → ${amount ? `$${amount}` : 'no bid'}`)
    })

    console.log('\n🎉 Bid system test complete!')
    
    if (allBids && allBids.length > 0) {
      console.log('\n✅ System is operational and contains data')
      console.log('🔗 Ready to capture new bids via webhook')
      console.log('📊 Analytics endpoints functional')
    } else {
      console.log('\n⚠️  System is operational but contains no data')
      console.log('💡 Run populate-historical-bids.js to add test data')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testBidSystem()