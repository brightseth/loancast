#!/usr/bin/env node

/**
 * Record Seth's $80 bid on Solienne's loan
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LOAN_ID = '0fd92bda-5b08-48b0-84f8-403c10d2929a';
const SETH_FID = 10224; // Your FID
const BID_AMOUNT = 80;

async function recordBid() {
  console.log('📝 Recording Seth\'s bid on Solienne\'s loan');
  console.log('═══════════════════════════════════════════\n');
  
  // Check if bid already exists
  const { data: existingBids, error: checkError } = await supabase
    .from('bids')
    .select('*')
    .eq('loan_id', LOAN_ID)
    .eq('bidder_fid', SETH_FID);
  
  if (existingBids && existingBids.length > 0) {
    console.log('⚠️  Bid already exists:');
    console.log('   Amount:', existingBids[0].bid_amount, 'USDC');
    console.log('   Status:', existingBids[0].status);
    console.log('   Created:', new Date(existingBids[0].created_at).toLocaleString());
    return;
  }
  
  // Create the bid
  const bidId = uuidv4();
  const now = new Date();
  const bid = {
    id: bidId,
    loan_id: LOAN_ID,
    bidder_fid: SETH_FID,
    bid_amount: BID_AMOUNT,
    bid_timestamp: now.toISOString(),
    bid_sequence: 1, // First bid on this loan
    cast_hash: `manual_bid_seth_${Date.now()}`, // Placeholder since it was placed manually
    status: 'winning', // First bid is winning by default
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };
  
  const { data: newBid, error: insertError } = await supabase
    .from('bids')
    .insert(bid)
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ Error creating bid:', insertError);
    return;
  }
  
  console.log('✅ Bid recorded successfully!');
  console.log('   Bid ID:', newBid.id);
  console.log('   Amount:', newBid.bid_amount, 'USDC');
  console.log('   Bidder FID:', newBid.bidder_fid);
  console.log('   Status:', newBid.status);
  console.log('   Created:', new Date(newBid.created_at).toLocaleString());
  
  // Fetch updated loan to see bid count
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('loan_id', LOAN_ID);
  
  console.log('\n📊 Total bids on loan:', bids ? bids.length : 0);
  
  // Calculate auction end time
  const { data: loan } = await supabase
    .from('loans')
    .select('created_at')
    .eq('id', LOAN_ID)
    .single();
  
  const auctionEnd = new Date(loan.created_at);
  auctionEnd.setHours(auctionEnd.getHours() + 24);
  const hoursLeft = (auctionEnd - new Date()) / (1000 * 60 * 60);
  
  console.log('\n⏰ AUCTION STATUS');
  console.log('   Ends:', auctionEnd.toLocaleString());
  console.log('   Time remaining:', hoursLeft.toFixed(1), 'hours');
  console.log('\n🎯 Next: Wait for auction to settle, then funding will proceed automatically');
}

recordBid().catch(console.error);