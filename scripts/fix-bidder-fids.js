#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixBidderFids() {
  console.log('🔧 Fixing Bidder FIDs for $1000 Loan Auction\n')
  
  const loanId = '03b72a87-8404-4d84-b266-a6a7fd8affa8'
  
  try {
    // First, let's see what we currently have
    console.log('📋 Current bid data:')
    const { data: currentBids } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loanId)
      .order('bid_sequence', { ascending: true })
    
    if (currentBids) {
      currentBids.forEach((bid, i) => {
        console.log(`${i+1}. FID ${bid.bidder_fid}: $${bid.bid_amount} (${bid.status})`)
      })
    }
    
    console.log('\n🎯 Need to identify correct FIDs:')
    console.log('- 1st bid ($1): You (seth)')
    console.log('- 2nd bid ($2): Goldy') 
    console.log('- 3rd bid ($3): Henry (we know this is FID 5046)')
    
    // Let's check existing loan data to find your FID
    console.log('\n🔍 Looking up FIDs from existing loan data...')
    
    const { data: loans } = await supabase
      .from('loans')
      .select('borrower_fid, lender_fid')
      .limit(10)
    
    if (loans) {
      const allFids = new Set()
      loans.forEach(loan => {
        if (loan.borrower_fid) allFids.add(loan.borrower_fid)
        if (loan.lender_fid) allFids.add(loan.lender_fid)
      })
      
      console.log('Known FIDs in system:', Array.from(allFids).sort())
    }
    
    // Check if we can find your FID from other loans where you're the borrower
    const { data: yourLoans } = await supabase
      .from('loans')
      .select('borrower_fid')
      .neq('id', loanId) // Exclude the $1000 loan
      .limit(5)
    
    console.log('\n❓ To fix this accurately, I need:')
    console.log('1. Your FID (seth)')
    console.log('2. Goldy\'s FID')
    console.log('3. Henry\'s FID is confirmed as 5046')
    
    console.log('\n💡 Options to get correct FIDs:')
    console.log('- Check your Farcaster profile URL')
    console.log('- Look at cast.farcaster.xyz for user profiles')
    console.log('- Check other loans you\'ve created (borrower_fid)')
    
    // For now, let's at least fix what we know for sure
    console.log('\n🔧 Updating Henry\'s bid to use correct FID...')
    
    // Find the $3 bid and make sure it has FID 5046
    const { data: henryBid } = await supabase
      .from('bids')
      .select('*')
      .eq('loan_id', loanId)
      .eq('bid_amount', 3.00)
      .single()
    
    if (henryBid && henryBid.bidder_fid !== 5046) {
      const { error: updateError } = await supabase
        .from('bids')
        .update({ 
          bidder_fid: 5046,
          updated_at: new Date().toISOString()
        })
        .eq('id', henryBid.id)
      
      if (updateError) {
        console.error('❌ Error updating Henry\'s FID:', updateError)
      } else {
        console.log('✅ Updated Henry\'s bid to use FID 5046')
      }
    } else if (henryBid) {
      console.log('✅ Henry\'s bid already has correct FID 5046')
    }
    
    console.log('\n📝 To complete the fix:')
    console.log('1. Provide your FID and Goldy\'s FID')
    console.log('2. I\'ll update the remaining bids with correct FIDs')
    console.log('3. The auction history will then be 100% accurate')
    
  } catch (error) {
    console.error('❌ Error fixing FIDs:', error)
  }
}

fixBidderFids()