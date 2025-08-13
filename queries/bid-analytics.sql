-- ========================================
-- LoanCast Bid Analytics Queries
-- Comprehensive queries for auction analysis
-- ========================================

-- 1. Overall Platform Auction Metrics
-- Shows funding efficiency, bid patterns, and market health
SELECT 
  COUNT(DISTINCT l.id) as total_auctions,
  COUNT(DISTINCT CASE WHEN l.status = 'funded' THEN l.id END) as completed_auctions,
  ROUND(AVG(
    CASE 
      WHEN l.status = 'funded' AND l.requested_usdc > 0 
      THEN (l.gross_usdc / l.requested_usdc) * 100 
    END
  ), 2) as avg_funding_efficiency_pct,
  COUNT(b.id) as total_bids,
  ROUND(AVG(bid_count.bids_per_auction), 1) as avg_bids_per_auction,
  COUNT(DISTINCT b.bidder_fid) as unique_bidders,
  ROUND(AVG(b.bid_amount), 2) as avg_bid_amount,
  MIN(b.bid_amount) as min_bid_amount,
  MAX(b.bid_amount) as max_bid_amount
FROM loans l
LEFT JOIN bids b ON l.id = b.loan_id
LEFT JOIN (
  SELECT loan_id, COUNT(*) as bids_per_auction
  FROM bids 
  GROUP BY loan_id
) bid_count ON l.id = bid_count.loan_id
WHERE l.created_at >= NOW() - INTERVAL '30 days';

-- 2. Auction Success Patterns
-- Analyzes which types of loans get funded and how
WITH auction_stats AS (
  SELECT 
    l.id,
    l.requested_usdc,
    l.gross_usdc,
    l.status,
    l.borrower_fid,
    l.lender_fid,
    COUNT(b.id) as total_bids,
    COUNT(CASE WHEN b.status = 'active' THEN 1 END) as active_bids,
    MAX(b.bid_amount) as highest_bid,
    MIN(b.bid_amount) as lowest_bid,
    CASE 
      WHEN l.status = 'funded' AND l.requested_usdc > 0 
      THEN (l.gross_usdc / l.requested_usdc) * 100 
      ELSE 0 
    END as funding_efficiency
  FROM loans l
  LEFT JOIN bids b ON l.id = b.loan_id
  WHERE l.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY l.id, l.requested_usdc, l.gross_usdc, l.status, l.borrower_fid, l.lender_fid
)
SELECT 
  -- Funding success by requested amount ranges
  CASE 
    WHEN requested_usdc <= 10 THEN '$1-10'
    WHEN requested_usdc <= 50 THEN '$11-50'
    WHEN requested_usdc <= 100 THEN '$51-100'
    WHEN requested_usdc <= 500 THEN '$101-500'
    ELSE '$500+'
  END as amount_range,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'funded' THEN 1 END) as funded_count,
  ROUND((COUNT(CASE WHEN status = 'funded' THEN 1 END)::float / COUNT(*)) * 100, 1) as funding_rate_pct,
  ROUND(AVG(total_bids), 1) as avg_bids_received,
  ROUND(AVG(funding_efficiency), 1) as avg_funding_efficiency_pct
FROM auction_stats
GROUP BY 
  CASE 
    WHEN requested_usdc <= 10 THEN '$1-10'
    WHEN requested_usdc <= 50 THEN '$11-50'
    WHEN requested_usdc <= 100 THEN '$51-100'
    WHEN requested_usdc <= 500 THEN '$101-500'
    ELSE '$500+'
  END
ORDER BY 
  MIN(requested_usdc);

-- 3. Top Lenders Analysis
-- Identifies most active and successful lenders
SELECT 
  b.bidder_fid,
  COUNT(DISTINCT b.loan_id) as auctions_participated,
  COUNT(*) as total_bids,
  COUNT(CASE WHEN b.status = 'winning' THEN 1 END) as auctions_won,
  ROUND((COUNT(CASE WHEN b.status = 'winning' THEN 1 END)::float / COUNT(DISTINCT b.loan_id)) * 100, 1) as win_rate_pct,
  ROUND(SUM(CASE WHEN b.status = 'winning' THEN b.bid_amount ELSE 0 END), 2) as total_amount_lent,
  ROUND(AVG(b.bid_amount), 2) as avg_bid_amount,
  MIN(b.bid_timestamp) as first_bid_date,
  MAX(b.bid_timestamp) as latest_bid_date,
  -- Bid aggressiveness: how much they bid vs loan request
  ROUND(AVG(
    CASE 
      WHEN l.requested_usdc > 0 
      THEN (b.bid_amount / l.requested_usdc) * 100 
    END
  ), 1) as avg_bid_vs_request_pct
FROM bids b
JOIN loans l ON b.loan_id = l.id
WHERE b.created_at >= NOW() - INTERVAL '30 days'
GROUP BY b.bidder_fid
HAVING COUNT(DISTINCT b.loan_id) >= 2  -- Only lenders with 2+ auctions
ORDER BY total_amount_lent DESC
LIMIT 20;

-- 4. Bidding Timing Patterns
-- Shows when bids typically occur (hourly distribution)
SELECT 
  EXTRACT(hour FROM b.bid_timestamp) as hour_of_day,
  COUNT(*) as total_bids,
  COUNT(DISTINCT b.loan_id) as auctions_with_bids,
  ROUND(AVG(b.bid_amount), 2) as avg_bid_amount,
  COUNT(CASE WHEN b.status = 'winning' THEN 1 END) as winning_bids,
  -- Bid success rate by hour
  ROUND((COUNT(CASE WHEN b.status = 'winning' THEN 1 END)::float / COUNT(*)) * 100, 1) as win_rate_pct
FROM bids b
WHERE b.created_at >= NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(hour FROM b.bid_timestamp)
ORDER BY hour_of_day;

-- 5. Bid Sequence Analysis
-- Analyzes early vs late bidding patterns
SELECT 
  CASE 
    WHEN b.bid_sequence = 1 THEN 'First bid'
    WHEN b.bid_sequence <= 3 THEN 'Early (2-3)'
    WHEN b.bid_sequence <= 5 THEN 'Middle (4-5)'
    ELSE 'Late (6+)'
  END as bid_timing,
  COUNT(*) as total_bids,
  COUNT(CASE WHEN b.status = 'winning' THEN 1 END) as winning_bids,
  ROUND((COUNT(CASE WHEN b.status = 'winning' THEN 1 END)::float / COUNT(*)) * 100, 1) as win_rate_pct,
  ROUND(AVG(b.bid_amount), 2) as avg_bid_amount,
  -- Bid aggressiveness by timing
  ROUND(AVG(
    CASE 
      WHEN l.requested_usdc > 0 
      THEN (b.bid_amount / l.requested_usdc) * 100 
    END
  ), 1) as avg_bid_vs_request_pct
FROM bids b
JOIN loans l ON b.loan_id = l.id
WHERE b.created_at >= NOW() - INTERVAL '30 days'
  AND b.bid_sequence IS NOT NULL
GROUP BY 
  CASE 
    WHEN b.bid_sequence = 1 THEN 'First bid'
    WHEN b.bid_sequence <= 3 THEN 'Early (2-3)'
    WHEN b.bid_sequence <= 5 THEN 'Middle (4-5)'
    ELSE 'Late (6+)'
  END
ORDER BY 
  CASE 
    WHEN bid_timing = 'First bid' THEN 1
    WHEN bid_timing = 'Early (2-3)' THEN 2
    WHEN bid_timing = 'Middle (4-5)' THEN 3
    ELSE 4
  END;

-- 6. Market Depth Analysis
-- Shows how competitive auctions are
WITH auction_depth AS (
  SELECT 
    l.id as loan_id,
    l.requested_usdc,
    l.gross_usdc,
    l.status,
    COUNT(b.id) as bid_count,
    COUNT(DISTINCT b.bidder_fid) as unique_bidders,
    MAX(b.bid_amount) - MIN(b.bid_amount) as bid_spread,
    STDDEV(b.bid_amount) as bid_volatility,
    array_agg(b.bid_amount ORDER BY b.bid_amount DESC) as bid_amounts
  FROM loans l
  JOIN bids b ON l.id = b.loan_id
  WHERE l.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY l.id, l.requested_usdc, l.gross_usdc, l.status
  HAVING COUNT(b.id) >= 2  -- Only auctions with multiple bids
)
SELECT 
  CASE 
    WHEN bid_count = 2 THEN '2 bids'
    WHEN bid_count <= 5 THEN '3-5 bids'
    WHEN bid_count <= 10 THEN '6-10 bids'
    ELSE '10+ bids'
  END as competition_level,
  COUNT(*) as auction_count,
  ROUND(AVG(bid_count), 1) as avg_bids,
  ROUND(AVG(unique_bidders), 1) as avg_unique_bidders,
  ROUND(AVG(bid_spread), 2) as avg_bid_spread,
  ROUND(AVG(bid_volatility), 2) as avg_bid_volatility,
  COUNT(CASE WHEN status = 'funded' THEN 1 END) as funded_count,
  ROUND((COUNT(CASE WHEN status = 'funded' THEN 1 END)::float / COUNT(*)) * 100, 1) as funding_rate_pct
FROM auction_depth
GROUP BY 
  CASE 
    WHEN bid_count = 2 THEN '2 bids'
    WHEN bid_count <= 5 THEN '3-5 bids'
    WHEN bid_count <= 10 THEN '6-10 bids'
    ELSE '10+ bids'
  END
ORDER BY MIN(bid_count);

-- 7. Individual Auction Deep Dive
-- Template query for analyzing a specific auction
-- Replace 'LOAN_ID_HERE' with actual loan ID
/*
SELECT 
  l.id as loan_id,
  l.requested_usdc,
  l.gross_usdc,
  l.status,
  l.borrower_fid,
  l.lender_fid,
  l.created_at as auction_start,
  l.updated_at as auction_end,
  -- Bid timeline
  json_agg(
    json_build_object(
      'sequence', b.bid_sequence,
      'bidder_fid', b.bidder_fid,
      'amount', b.bid_amount,
      'timestamp', b.bid_timestamp,
      'status', b.status,
      'cast_hash', b.cast_hash
    ) ORDER BY b.bid_sequence
  ) as bid_timeline,
  -- Summary stats
  COUNT(b.id) as total_bids,
  COUNT(DISTINCT b.bidder_fid) as unique_bidders,
  MIN(b.bid_amount) as min_bid,
  MAX(b.bid_amount) as max_bid,
  ROUND(AVG(b.bid_amount), 2) as avg_bid,
  ROUND((l.gross_usdc / l.requested_usdc) * 100, 1) as funding_efficiency_pct
FROM loans l
LEFT JOIN bids b ON l.id = b.loan_id
WHERE l.id = 'LOAN_ID_HERE'
GROUP BY l.id, l.requested_usdc, l.gross_usdc, l.status, l.borrower_fid, l.lender_fid, l.created_at, l.updated_at;
*/

-- 8. Lender Behavior Cohorts
-- Groups lenders by activity level and analyzes behavior
WITH lender_activity AS (
  SELECT 
    b.bidder_fid,
    COUNT(DISTINCT b.loan_id) as auctions_participated,
    COUNT(*) as total_bids,
    COUNT(CASE WHEN b.status = 'winning' THEN 1 END) as wins,
    SUM(CASE WHEN b.status = 'winning' THEN b.bid_amount ELSE 0 END) as total_lent,
    MIN(b.bid_timestamp) as first_activity,
    MAX(b.bid_timestamp) as last_activity
  FROM bids b
  WHERE b.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY b.bidder_fid
)
SELECT 
  CASE 
    WHEN auctions_participated = 1 THEN 'One-time bidders'
    WHEN auctions_participated <= 3 THEN 'Casual lenders'
    WHEN auctions_participated <= 10 THEN 'Active lenders'
    ELSE 'Power lenders'
  END as lender_type,
  COUNT(*) as lender_count,
  ROUND(AVG(auctions_participated), 1) as avg_auctions,
  ROUND(AVG(total_bids), 1) as avg_total_bids,
  ROUND(AVG(wins), 1) as avg_wins,
  ROUND(AVG(total_lent), 2) as avg_amount_lent,
  ROUND((SUM(wins)::float / SUM(total_bids)) * 100, 1) as cohort_win_rate_pct
FROM lender_activity
GROUP BY 
  CASE 
    WHEN auctions_participated = 1 THEN 'One-time bidders'
    WHEN auctions_participated <= 3 THEN 'Casual lenders'
    WHEN auctions_participated <= 10 THEN 'Active lenders'
    ELSE 'Power lenders'
  END
ORDER BY MIN(auctions_participated);

-- 9. Recent Activity Summary
-- Real-time view of last 24 hours
SELECT 
  COUNT(DISTINCT l.id) as new_auctions_24h,
  COUNT(DISTINCT CASE WHEN l.status = 'funded' THEN l.id END) as completed_auctions_24h,
  COUNT(b.id) as new_bids_24h,
  COUNT(DISTINCT b.bidder_fid) as active_bidders_24h,
  ROUND(SUM(CASE WHEN b.status = 'winning' THEN b.bid_amount ELSE 0 END), 2) as volume_funded_24h,
  ROUND(AVG(CASE WHEN l.status = 'funded' AND l.requested_usdc > 0 THEN (l.gross_usdc / l.requested_usdc) * 100 END), 1) as avg_efficiency_24h
FROM loans l
LEFT JOIN bids b ON l.id = b.loan_id AND b.created_at >= NOW() - INTERVAL '24 hours'
WHERE l.created_at >= NOW() - INTERVAL '24 hours';

-- 10. Export-Ready Auction Data
-- Full dataset for external analysis
SELECT 
  l.id as loan_id,
  l.cast_hash,
  l.borrower_fid,
  l.lender_fid,
  l.requested_usdc,
  l.gross_usdc,
  l.status as loan_status,
  l.created_at as auction_start,
  l.updated_at as auction_end,
  b.bidder_fid,
  b.bid_amount,
  b.bid_timestamp,
  b.bid_sequence,
  b.status as bid_status,
  b.cast_hash as bid_cast_hash,
  -- Calculated fields
  CASE WHEN l.requested_usdc > 0 THEN (b.bid_amount / l.requested_usdc) * 100 ELSE 0 END as bid_vs_request_pct,
  EXTRACT(hour FROM b.bid_timestamp) as bid_hour,
  EXTRACT(dow FROM b.bid_timestamp) as bid_day_of_week,
  DATE_TRUNC('day', b.bid_timestamp) as bid_date
FROM loans l
LEFT JOIN bids b ON l.id = b.loan_id
WHERE l.created_at >= NOW() - INTERVAL '30 days'
ORDER BY l.created_at DESC, b.bid_sequence ASC;