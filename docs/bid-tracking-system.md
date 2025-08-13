# LoanCast Bid Tracking System

## Overview

The LoanCast bid tracking system captures and analyzes all auction activity on the platform. This system tracks every bid placed on loan requests, providing comprehensive analytics for market analysis and platform optimization.

## System Architecture

### Database Schema

The bid tracking system is built around the `bids` table:

```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  bidder_fid BIGINT NOT NULL,
  bid_amount NUMERIC(18,2) NOT NULL,
  bid_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bid_sequence INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'winning', 'losing')),
  cast_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Features

1. **Automatic Bid Sequencing**: Uses triggers to automatically assign sequence numbers (1st bid, 2nd bid, etc.)
2. **Status Management**: Automatically updates bid statuses when loans are funded
3. **Unique Active Bids**: Prevents duplicate active bids from the same user on the same loan
4. **Historical Tracking**: Maintains complete bid timeline for each auction

### Status Types

- `active`: Current bid that could win the auction
- `withdrawn`: User cancelled their bid
- `winning`: Won the auction when loan was funded  
- `losing`: Lost the auction when loan was funded

## API Endpoints

### `/api/bids` (GET, POST, PATCH)

**GET** - Query bids with filtering:
```bash
curl "/api/bids?loan_id=XXX&status=active&limit=50"
```

**POST** - Create or update a bid:
```json
{
  "loan_id": "uuid",
  "bidder_fid": 12345,
  "bid_amount": 25.50,
  "cast_hash": "0x123...",
  "operator_key": "secret" // Optional, for manual entries
}
```

**PATCH** - Update bid status:
```json
{
  "bid_id": "uuid",
  "status": "withdrawn",
  "operator_key": "secret"
}
```

### `/api/bids/analytics` (GET)

Comprehensive analytics endpoint:
```bash
# Platform-wide analytics
curl "/api/bids/analytics?timeframe=30d"

# Specific auction analysis
curl "/api/bids/analytics?loan_id=XXX"

# Specific metrics
curl "/api/bids/analytics?metric=lender_activity"
```

Returns structured data for:
- Auction efficiency metrics
- Bidding patterns and timing
- Lender activity analysis
- Individual loan summaries

## Data Capture

### Automatic Capture via Webhooks

The Neynar webhook (`/api/webhooks/neynar/route.ts`) automatically captures bids:

1. **Cast Created**: When someone replies to a loan cast with a bid amount
2. **Bid Parsing**: Extracts dollar amounts from reply text  
3. **Bid Storage**: Creates or updates bid in the `bids` table
4. **Status Management**: Handles bid updates and withdrawals

### Manual Entry

For historical data or missed bids, use the operator key:

```javascript
await fetch('/api/bids', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    loan_id: 'uuid',
    bidder_fid: 5046,
    bid_amount: 3.00,
    operator_key: process.env.BID_OPERATOR_SECRET
  })
})
```

## Analytics & Insights

### Key Metrics Tracked

1. **Auction Efficiency**: How much funding requests receive vs. requested amount
2. **Bidding Patterns**: Timing, sequence, and amount distributions  
3. **Lender Activity**: Individual lender behavior and success rates
4. **Market Depth**: Competition levels and bid spreads

### Pre-built Queries

The system includes 10 comprehensive SQL queries in `/queries/bid-analytics.sql`:

1. **Platform Overview**: Overall auction metrics
2. **Success Patterns**: Which loan types get funded
3. **Top Lenders**: Most active and successful lenders  
4. **Timing Patterns**: Hourly bidding distribution
5. **Sequence Analysis**: Early vs late bidding success
6. **Market Depth**: Competition and bid spreads
7. **Individual Auction**: Deep dive template
8. **Lender Cohorts**: Behavioral segments
9. **Recent Activity**: Real-time metrics
10. **Export Data**: Full dataset for external analysis

### Dashboard Script

Generate analytics dashboard:
```bash
node scripts/bid-analytics-dashboard.js
```

## Deployment & Setup

### 1. Database Migration

The bids table must be created manually in Supabase dashboard:

```sql
-- Copy and run the complete migration from:
-- supabase/migrations/create_bids_table.sql
```

### 2. Environment Variables

```bash
# Required for manual bid entry
BID_OPERATOR_SECRET=your_secret_key

# Already configured
NEYNAR_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key
```

### 3. Populate Historical Data

```bash
# Add historical auction data
node scripts/populate-historical-bids.js
```

## Usage Examples

### Query Specific Auction

```javascript
const auctionData = await fetch(`/api/bids/analytics?loan_id=${loanId}`)
const { loan_summary } = await auctionData.json()

console.log(`Total bids: ${loan_summary.auction_stats.total_bids}`)
console.log(`Winner: FID ${loan_summary.auction_stats.winning_bid?.bidder_fid}`)
console.log(`Efficiency: ${loan_summary.auction_stats.funding_efficiency}%`)
```

### Track Top Lenders

```javascript
const analytics = await fetch('/api/bids/analytics?metric=lender_activity')
const { lender_activity } = await analytics.json()

lender_activity.top_lenders.forEach(lender => {
  console.log(`FID ${lender.bidder_fid}: ${lender.win_rate}% win rate`)
})
```

### Monitor Platform Health

```javascript
const overview = await fetch('/api/bids/analytics?metric=auction_efficiency')
const { auction_efficiency } = await overview.json()

console.log(`Platform efficiency: ${overview.summary.avg_funding_efficiency}%`)
console.log(`Avg bids per auction: ${overview.summary.avg_bids_per_auction}`)
```

## Benefits

### For Platform Operations

- **Market Insight**: Understand bidding behavior and optimize auction mechanics
- **Lender Analysis**: Identify top performers and engagement patterns  
- **Risk Assessment**: Monitor auction success rates and funding efficiency
- **Product Development**: Data-driven improvements to the lending experience

### For Users

- **Transparency**: Full visibility into auction activity
- **Strategy**: Historical data helps lenders optimize bidding
- **Trust**: Complete audit trail of all auction activity
- **Analytics**: Rich insights into market dynamics

## Technical Notes

### Performance Considerations

- All queries are indexed for optimal performance
- Analytics endpoints are cached for 5 minutes
- Rate limiting prevents abuse
- Batch operations supported for bulk data

### Data Integrity

- Foreign key constraints ensure data consistency
- Triggers automatically manage bid sequences
- Unique constraints prevent duplicate active bids
- Status updates are atomic and consistent

### Security

- Operator keys required for manual entries
- Rate limiting on all endpoints
- Input validation and sanitization
- Audit trail for all modifications

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration for live auction feeds
2. **Advanced Analytics**: ML-powered insights and predictions  
3. **Bid Notifications**: Alert system for auction activity
4. **Historical Exports**: CSV/JSON export functionality
5. **API Webhooks**: External integrations for auction events

### Scaling Considerations

- Partition large tables by date ranges
- Archive old auction data to cold storage  
- Implement read replicas for analytics queries
- Cache frequently accessed metrics

## Support

For issues or questions about the bid tracking system:

1. Check the analytics dashboard: `node scripts/bid-analytics-dashboard.js`
2. Review query examples in `/queries/bid-analytics.sql`
3. Test APIs with sample loan IDs
4. Verify database migration completed successfully

The bid tracking system provides comprehensive visibility into LoanCast's auction marketplace, enabling data-driven optimization and transparent lending operations.