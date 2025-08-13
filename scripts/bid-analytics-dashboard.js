#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function generateBidAnalyticsDashboard() {
  console.log('🚀 LoanCast Bid Analytics Dashboard')
  console.log('====================================\n')

  try {
    // Check if bids table has data
    const { data: bidCount, error: countError } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log('❌ Could not access bids table')
      console.log('Please ensure the migration has been run')
      return
    }

    const totalBids = bidCount?.length || 0
    console.log(`📊 Total Bids in System: ${totalBids}`)

    if (totalBids === 0) {
      console.log('📝 No bid data found. Run populate-historical-bids.js first')
      return
    }

    console.log('\n' + '='.repeat(60) + '\n')

    // 1. Platform Overview
    await showPlatformOverview()

    console.log('\n' + '='.repeat(60) + '\n')

    // 2. Top Lenders
    await showTopLenders()

    console.log('\n' + '='.repeat(60) + '\n')

    // 3. Auction Analysis
    await showAuctionAnalysis()

    console.log('\n' + '='.repeat(60) + '\n')

    // 4. Recent Activity
    await showRecentActivity()

    console.log('\n🎯 Dashboard complete! Use these APIs for real-time data:')
    console.log('- GET /api/bids - List all bids')
    console.log('- GET /api/bids/analytics - Comprehensive analytics')
    console.log('- GET /api/bids/analytics?loan_id=XXX - Specific auction analysis')

  } catch (error) {
    console.error('❌ Dashboard error:', error)
  }
}

async function showPlatformOverview() {
  console.log('🏢 PLATFORM OVERVIEW')
  console.log('====================')

  // Get basic metrics
  const { data: metrics } = await supabase.rpc('exec', {
    sql: `
      SELECT 
        COUNT(DISTINCT l.id) as total_auctions,
        COUNT(DISTINCT CASE WHEN l.status = 'funded' THEN l.id END) as completed_auctions,
        ROUND(AVG(
          CASE 
            WHEN l.status = 'funded' AND l.requested_usdc > 0 
            THEN (l.gross_usdc / l.requested_usdc) * 100 
          END
        ), 2) as avg_funding_efficiency,
        COUNT(b.id) as total_bids,
        COUNT(DISTINCT b.bidder_fid) as unique_bidders,
        ROUND(AVG(b.bid_amount), 2) as avg_bid_amount
      FROM loans l
      LEFT JOIN bids b ON l.id = b.loan_id
    `
  })

  if (metrics && metrics.length > 0) {
    const m = metrics[0]
    console.log(`Total Auctions: ${m.total_auctions || 0}`)
    console.log(`Completed Auctions: ${m.completed_auctions || 0}`)
    console.log(`Average Funding Efficiency: ${m.avg_funding_efficiency || 0}%`)
    console.log(`Total Bids Placed: ${m.total_bids || 0}`)
    console.log(`Unique Bidders: ${m.unique_bidders || 0}`)
    console.log(`Average Bid Amount: $${m.avg_bid_amount || 0}`)
  } else {
    // Fallback to simple queries
    const { data: loans } = await supabase
      .from('loans')
      .select('*')

    const { data: bids } = await supabase
      .from('bids')
      .select('*')

    const totalAuctions = loans?.length || 0
    const completedAuctions = loans?.filter(l => l.status === 'funded').length || 0
    const totalBids = bids?.length || 0
    const uniqueBidders = new Set(bids?.map(b => b.bidder_fid)).size

    console.log(`Total Auctions: ${totalAuctions}`)
    console.log(`Completed Auctions: ${completedAuctions}`)
    console.log(`Total Bids Placed: ${totalBids}`)
    console.log(`Unique Bidders: ${uniqueBidders}`)

    if (totalBids > 0) {
      const avgBid = bids.reduce((sum, b) => sum + b.bid_amount, 0) / totalBids
      console.log(`Average Bid Amount: $${avgBid.toFixed(2)}`)
    }
  }
}

async function showTopLenders() {
  console.log('🏆 TOP LENDERS')
  console.log('===============')

  const { data: lenders } = await supabase
    .from('bids')
    .select(`
      bidder_fid,
      bid_amount,
      status,
      loan_id
    `)

  if (!lenders || lenders.length === 0) {
    console.log('No lender data available')
    return
  }

  // Group by bidder
  const lenderStats = lenders.reduce((acc, bid) => {
    const fid = bid.bidder_fid
    if (!acc[fid]) {
      acc[fid] = {
        bidder_fid: fid,
        total_bids: 0,
        winning_bids: 0,
        total_amount_bid: 0,
        auctions_participated: new Set()
      }
    }

    acc[fid].total_bids++
    acc[fid].total_amount_bid += bid.bid_amount
    acc[fid].auctions_participated.add(bid.loan_id)

    if (bid.status === 'winning') {
      acc[fid].winning_bids++
    }

    return acc
  }, {})

  // Convert to array and sort
  const sortedLenders = Object.values(lenderStats)
    .map(lender => ({
      ...lender,
      auctions_participated: lender.auctions_participated.size,
      avg_bid: lender.total_amount_bid / lender.total_bids,
      win_rate: (lender.winning_bids / lender.total_bids) * 100
    }))
    .sort((a, b) => b.total_amount_bid - a.total_amount_bid)
    .slice(0, 5)

  sortedLenders.forEach((lender, index) => {
    console.log(`${index + 1}. FID ${lender.bidder_fid}`)
    console.log(`   Total Bids: ${lender.total_bids}`)
    console.log(`   Auctions: ${lender.auctions_participated}`)
    console.log(`   Win Rate: ${lender.win_rate.toFixed(1)}%`)
    console.log(`   Avg Bid: $${lender.avg_bid.toFixed(2)}`)
    console.log('')
  })
}

async function showAuctionAnalysis() {
  console.log('🎯 AUCTION ANALYSIS')
  console.log('===================')

  const { data: auctions } = await supabase
    .from('loans')
    .select(`
      id,
      requested_usdc,
      gross_usdc,
      status,
      bids (
        bidder_fid,
        bid_amount,
        status
      )
    `)

  if (!auctions) {
    console.log('No auction data available')
    return
  }

  console.log('Auction Details:')
  console.log('----------------')

  auctions.forEach((auction, index) => {
    const bids = auction.bids || []
    const bidCount = bids.length
    const uniqueBidders = new Set(bids.map(b => b.bidder_fid)).size
    const winningBid = bids.find(b => b.status === 'winning')

    console.log(`${index + 1}. Loan ID: ${auction.id.substring(0, 8)}...`)
    console.log(`   Requested: $${auction.requested_usdc}`)
    if (auction.status === 'funded') {
      console.log(`   Funded: $${auction.gross_usdc}`)
      console.log(`   Efficiency: ${((auction.gross_usdc / auction.requested_usdc) * 100).toFixed(1)}%`)
    }
    console.log(`   Total Bids: ${bidCount}`)
    console.log(`   Unique Bidders: ${uniqueBidders}`)
    if (winningBid) {
      console.log(`   Winning Bid: $${winningBid.bid_amount} (FID ${winningBid.bidder_fid})`)
    }
    console.log(`   Status: ${auction.status}`)
    console.log('')
  })

  // Summary stats
  const totalBidCount = auctions.reduce((sum, a) => sum + (a.bids?.length || 0), 0)
  const fundedAuctions = auctions.filter(a => a.status === 'funded')
  
  console.log('Summary:')
  console.log('--------')
  console.log(`Total Auctions: ${auctions.length}`)
  console.log(`Funded Auctions: ${fundedAuctions.length}`)
  console.log(`Success Rate: ${((fundedAuctions.length / auctions.length) * 100).toFixed(1)}%`)
  console.log(`Total Bids: ${totalBidCount}`)
  console.log(`Avg Bids/Auction: ${(totalBidCount / auctions.length).toFixed(1)}`)
}

async function showRecentActivity() {
  console.log('⚡ RECENT ACTIVITY')
  console.log('==================')

  // Get recent bids (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: recentBids } = await supabase
    .from('bids')
    .select(`
      bidder_fid,
      bid_amount,
      bid_timestamp,
      status,
      loan_id
    `)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!recentBids || recentBids.length === 0) {
    console.log('No recent activity')
    return
  }

  console.log('Latest Bids:')
  console.log('------------')

  recentBids.forEach((bid, index) => {
    const timeAgo = Math.floor((Date.now() - new Date(bid.bid_timestamp).getTime()) / (1000 * 60 * 60))
    console.log(`${index + 1}. FID ${bid.bidder_fid} bid $${bid.bid_amount} (${timeAgo}h ago) - ${bid.status}`)
  })

  // Activity summary
  const uniqueBidders = new Set(recentBids.map(b => b.bidder_fid)).size
  const totalAmount = recentBids.reduce((sum, b) => sum + b.bid_amount, 0)

  console.log('')
  console.log('7-Day Summary:')
  console.log('--------------')
  console.log(`New Bids: ${recentBids.length}`)
  console.log(`Active Bidders: ${uniqueBidders}`)
  console.log(`Total Bid Volume: $${totalAmount.toFixed(2)}`)
}

generateBidAnalyticsDashboard()