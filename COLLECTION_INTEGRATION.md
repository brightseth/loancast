# Cast Collection → Loan Funding Integration

## Overview
When a Farcaster cast is collected as an NFT/collectible, it should automatically fund the associated loan.

## Current State (Manual)
- Collections are NOT automatically detected
- Manual intervention required via admin API
- Successfully tested with Henry's loan ($100 collection)

## Automated Solution Architecture

### 1. Webhook Integration Needed
Farcaster/Warpcast needs to send webhooks when:
- Cast is collected
- Collection payment processed
- Funds are available

### 2. Data Flow
```
Cast Collection Event
    ↓
Webhook to LoanCast
    ↓
Verify Collection Amount
    ↓
Update Loan Status
    ↓
Notify Parties
    ↓
Track for Repayment
```

### 3. Implementation Steps

#### A. Neynar Webhook Enhancement
```typescript
// Add to existing webhook handler
case 'cast.collected':
  await handleCastCollection({
    castHash: data.cast.hash,
    collectorFid: data.collector.fid,
    collectionAmount: data.amount,
    transactionHash: data.transaction_hash
  })
  break
```

#### B. Collection Handler
- Verify cast belongs to a loan
- Check collection amount meets minimum
- Update loan status to funded
- Create notifications
- Store collection metadata

#### C. Smart Contract Integration (Future)
- Deploy collection splitter contract
- Auto-route funds to borrower
- Keep platform fee if applicable
- Handle refunds if needed

### 4. Testing Requirements
- Mock collection events
- Verify fund routing
- Test edge cases (double collection, refunds)
- Ensure idempotency

### 5. Monitoring
- Track collection success rate
- Monitor funding delays
- Alert on failed collections
- Dashboard for collection metrics

## API Endpoints

### POST /api/webhooks/cast-collection
Handles collection events from Farcaster

### PUT /api/admin/manual-fund
Manual backup for marking loans as funded

### GET /api/loans/[id]/collection-status
Check collection status for a specific loan

## Database Schema Updates
```sql
ALTER TABLE loans ADD COLUMN collection_metadata JSONB;
ALTER TABLE loans ADD COLUMN collection_platform TEXT;
ALTER TABLE loans ADD COLUMN collection_fee_bps INTEGER;
```

## Security Considerations
- Verify webhook signatures
- Prevent double funding
- Validate collection amounts
- Audit trail for all collections

## Next Steps
1. ✅ Manual funding endpoint (complete)
2. ⏳ Contact Neynar about collection webhooks
3. ⏳ Implement automated handler
4. ⏳ Deploy and test with real collections
5. ⏳ Monitor and optimize