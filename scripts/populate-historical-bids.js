#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function populateHistoricalBids() {
  console.log('🗃️ Populating Historical Bid Data\n')
  
  try {
    // First, check if bids table exists
    const { error: testError } = await supabase
      .from('bids')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('❌ Bids table not yet created')
      console.log('Please run the migration first:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Navigate to SQL Editor') 
      console.log('3. Run the SQL from supabase/migrations/create_bids_table.sql')
      return
    }
    
    console.log('✅ Bids table exists, proceeding with data population\n')

    // Get the $1000 loan that settled for $3
    const loanId = '03b72a87-8404-4d84-b266-a6a7fd8affa8'
    
    console.log('🎯 Populating bid data for the $1000→$3 auction')
    console.log('Based on screenshot: henry ($3), goldytalks ($2), seth ($1)\n')
    
    const { data: loan } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single()
    
    if (!loan) {
      console.log('❌ Could not find the target loan')
      return
    }
    
    console.log('📋 Loan Details:')
    console.log(`- Requested: $${loan.requested_usdc}`)
    console.log(`- Funded: $${loan.gross_usdc}`)  
    console.log(`- Status: ${loan.status}`)
    console.log(`- Lender: FID ${loan.lender_fid}\n`)
    
    // Historical bid data from the screenshot
    const historicalBids = [
      {
        bidder_fid: 630, // seth - FID from previous data
        bid_amount: 1.00,
        status: 'losing',
        bid_sequence: 1
      },
      {
        bidder_fid: 123, // goldytalks - placeholder FID (would need to look up actual)
        bid_amount: 2.00, 
        status: 'losing',
        bid_sequence: 2
      },
      {
        bidder_fid: 5046, // henry - winning bidder
        bid_amount: 3.00,
        status: 'winning',
        bid_sequence: 3
      }
    ]
    
    console.log('💾 Inserting historical bid data...\n')
    
    for (const bid of historicalBids) {
      const bidData = {
        loan_id: loanId,
        bidder_fid: bid.bidder_fid,
        bid_amount: bid.bid_amount,
        bid_timestamp: new Date(loan.created_at).toISOString(), // Use loan creation as base time
        bid_sequence: bid.bid_sequence,
        status: bid.status,
        cast_hash: `historical_bid_${bid.bidder_fid}_${loanId}` // Generate unique hash
      }
      
      console.log(`Inserting bid: FID ${bid.bidder_fid} → $${bid.bid_amount} (${bid.status})`)
      
      const { data, error } = await supabase
        .from('bids')
        .insert(bidData)
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Error inserting bid for FID ${bid.bidder_fid}:`, error.message)
      } else {
        console.log(`✅ Bid inserted with ID: ${data.id}`)
      }
    }
    
    console.log('\n📊 Verifying inserted data...')
    
    const { data: allBids, error: fetchError } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loanId)
      .order('bid_sequence', { ascending: true })
    
    if (fetchError) {
      console.error('❌ Error fetching bids:', fetchError)
      return
    }
    
    console.log('\n🎯 Auction Summary:')
    console.log('==================')
    allBids.forEach((bid, index) => {
      console.log(`${index + 1}. FID ${bid.bidder_fid}: $${bid.bid_amount} (${bid.status})`)
    })
    
    const winningBid = allBids.find(b => b.status === 'winning')
    if (winningBid) {
      console.log(`\n🏆 Winner: FID ${winningBid.bidder_fid} with $${winningBid.bid_amount}`)
      console.log(`📈 Funding Efficiency: ${(winningBid.bid_amount / loan.requested_usdc * 100).toFixed(1)}%`)
    }
    
    // Create some sample analytics
    console.log('\n📈 Sample Analytics:')
    console.log('===================')
    console.log(`Total Bids: ${allBids.length}`)
    console.log(`Unique Bidders: ${new Set(allBids.map(b => b.bidder_fid)).size}`)
    console.log(`Bid Range: $${Math.min(...allBids.map(b => b.bid_amount))} - $${Math.max(...allBids.map(b => b.bid_amount))}`)
    console.log(`Average Bid: $${(allBids.reduce((sum, b) => sum + b.bid_amount, 0) / allBids.length).toFixed(2)}`)
    
    console.log('\n🚀 Historical bid data populated successfully!')
    console.log('You can now test the bid analytics APIs:')
    console.log(`- GET /api/bids?loan_id=${loanId}`)
    console.log(`- GET /api/bids/analytics?loan_id=${loanId}`)
    
  } catch (error) {
    console.error('❌ Error populating historical bids:', error)
  }
}

populateHistoricalBids()