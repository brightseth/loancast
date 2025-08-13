#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function correctAuctionFids() {
  console.log('🔧 Correcting Auction FIDs\n')
  
  const loanId = '03b72a87-8404-4d84-b266-a6a7fd8affa8'
  
  // Correct mapping based on user input:
  // seth (FID 5046): $3 winning bid
  // henry (FID 732): $1 losing bid  
  // goldytalks (FID 240586): $2 losing bid
  
  const correctBids = [
    {
      amount: 1.00,
      bidder_fid: 732,      // henry
      status: 'losing',
      sequence: 1
    },
    {
      amount: 2.00, 
      bidder_fid: 240586,   // goldytalks
      status: 'losing',
      sequence: 2
    },
    {
      amount: 3.00,
      bidder_fid: 5046,     // seth - winning bid
      status: 'winning',
      sequence: 3
    }
  ]
  
  try {
    console.log('📋 Correcting bid data:')
    console.log('- $1 bid: henry (FID 732) - losing')
    console.log('- $2 bid: goldytalks (FID 240586) - losing') 
    console.log('- $3 bid: seth (FID 5046) - winning\n')
    
    // Get current bids
    const { data: currentBids } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loanId)
      .order('bid_amount', { ascending: true })
    
    if (!currentBids || currentBids.length !== 3) {
      console.log('❌ Expected 3 bids, found:', currentBids?.length || 0)
      return
    }
    
    // Update each bid with correct FID
    for (let i = 0; i < correctBids.length; i++) {
      const currentBid = currentBids[i]
      const correctBid = correctBids[i]
      
      console.log(`Updating $${correctBid.amount} bid...`)
      
      const { error } = await supabase
        .from('bids')
        .update({
          bidder_fid: correctBid.bidder_fid,
          bid_sequence: correctBid.sequence,
          status: correctBid.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentBid.id)
      
      if (error) {
        console.error(`❌ Error updating $${correctBid.amount} bid:`, error)
      } else {
        console.log(`✅ Updated $${correctBid.amount} bid → FID ${correctBid.bidder_fid} (${correctBid.status})`)
      }
    }
    
    // Also need to update the loan's lender_fid since seth won
    console.log('\n🔧 Updating loan lender_fid to seth (5046)...')
    
    const { error: loanError } = await supabase
      .from('loans')
      .update({
        lender_fid: 5046,  // seth won the auction
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId)
    
    if (loanError) {
      console.error('❌ Error updating loan lender:', loanError)
    } else {
      console.log('✅ Updated loan lender_fid to seth (5046)')
    }
    
    // Verify the corrections
    console.log('\n📊 Verifying corrected data...')
    
    const { data: correctedBids } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loanId)
      .order('bid_sequence', { ascending: true })
    
    if (correctedBids) {
      console.log('\n🎯 Corrected Auction Summary:')
      console.log('=============================')
      correctedBids.forEach((bid, i) => {
        const name = bid.bidder_fid === 5046 ? 'seth' : 
                    bid.bidder_fid === 732 ? 'henry' : 
                    bid.bidder_fid === 240586 ? 'goldytalks' : `FID ${bid.bidder_fid}`
        console.log(`${i+1}. ${name} (FID ${bid.bidder_fid}): $${bid.bid_amount} (${bid.status})`)
      })
      
      const winner = correctedBids.find(b => b.status === 'winning')
      if (winner) {
        const winnerName = winner.bidder_fid === 5046 ? 'seth' : 'unknown'
        console.log(`\n🏆 Winner: ${winnerName} (FID ${winner.bidder_fid}) with $${winner.bid_amount}`)
      }
    }
    
    console.log('\n✅ Auction FIDs corrected successfully!')
    console.log('The bid tracking system now has accurate historical data.')
    
  } catch (error) {
    console.error('❌ Error correcting FIDs:', error)
  }
}

correctAuctionFids()