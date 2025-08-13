#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function finalFixAuction() {
  console.log('🔧 Final Fix: Henry Won the $3 Bid\n')
  
  const loanId = '03b72a87-8404-4d84-b266-a6a7fd8affa8'
  
  // CORRECT mapping:
  // seth (FID 5046): $1 losing bid
  // goldytalks (FID 240586): $2 losing bid  
  // henry (FID 732): $3 WINNING bid
  
  const correctBids = [
    {
      amount: 1.00,
      bidder_fid: 5046,     // seth
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
      bidder_fid: 732,      // henry - WINNER
      status: 'winning',
      sequence: 3
    }
  ]
  
  try {
    console.log('📋 CORRECT auction data:')
    console.log('- $1 bid: seth (FID 5046) - losing')
    console.log('- $2 bid: goldytalks (FID 240586) - losing') 
    console.log('- $3 bid: henry (FID 732) - WINNING 🏆\n')
    
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
    
    // Update each bid with correct FID and status
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
        const name = correctBid.bidder_fid === 5046 ? 'seth' : 
                    correctBid.bidder_fid === 732 ? 'henry' : 
                    correctBid.bidder_fid === 240586 ? 'goldytalks' : `FID ${correctBid.bidder_fid}`
        console.log(`✅ $${correctBid.amount} → ${name} (FID ${correctBid.bidder_fid}) - ${correctBid.status}`)
      }
    }
    
    // Update the loan's lender_fid to henry (732) since he won
    console.log('\n🔧 Updating loan lender_fid to henry (732)...')
    
    const { error: loanError } = await supabase
      .from('loans')
      .update({
        lender_fid: 732,  // henry won the auction
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId)
    
    if (loanError) {
      console.error('❌ Error updating loan lender:', loanError)
    } else {
      console.log('✅ Updated loan lender_fid to henry (732)')
    }
    
    // Final verification
    console.log('\n📊 Final Verification...')
    
    const { data: finalBids } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loanId)
      .order('bid_sequence', { ascending: true })
    
    const { data: finalLoan } = await supabase
      .from('loans')
      .select('lender_fid, gross_usdc')
      .eq('id', loanId)
      .single()
    
    if (finalBids && finalLoan) {
      console.log('\n🎯 FINAL Auction Summary:')
      console.log('=========================')
      finalBids.forEach((bid, i) => {
        const name = bid.bidder_fid === 5046 ? 'seth' : 
                    bid.bidder_fid === 732 ? 'henry' : 
                    bid.bidder_fid === 240586 ? 'goldytalks' : `FID ${bid.bidder_fid}`
        const emoji = bid.status === 'winning' ? ' 🏆' : ''
        console.log(`${i+1}. ${name} (FID ${bid.bidder_fid}): $${bid.bid_amount} (${bid.status})${emoji}`)
      })
      
      console.log(`\nLoan Details:`)
      console.log(`- Lender: henry (FID ${finalLoan.lender_fid})`)
      console.log(`- Amount Funded: $${finalLoan.gross_usdc}`)
      console.log(`- Funding Efficiency: ${((finalLoan.gross_usdc / 1000) * 100).toFixed(1)}%`)
    }
    
    console.log('\n✅ FINAL FIX COMPLETE!')
    console.log('Henry is correctly recorded as the winning lender.')
    
  } catch (error) {
    console.error('❌ Error with final fix:', error)
  }
}

finalFixAuction()