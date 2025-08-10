# Tracking Requested vs Funded Amounts

## Problem
Need to track the difference between what borrowers **request** vs what they actually **receive** through the auction/settlement process.

## Solution
Added `requested_usdc` field to the loans table to track the original requested amount separately from the funded amount.

## Database Schema Changes

### New Field Added:
- `requested_usdc` - Original amount requested by borrower

### Updated Field Meanings:
- `requested_usdc` - What borrower originally asked for  
- `gross_usdc` - Actual amount funded after auction/settlement
- `net_usdc` - Net amount received by borrower after fees
- `repay_usdc` - Total repayment amount (principal + interest)

## Implementation

### 1. Database Migration
- **File**: `supabase/migrations/add_requested_amount.sql`
- **Script**: `scripts/add-requested-amount-field.js`
- **Run with**: `node scripts/add-requested-amount-field.js`

### 2. API Updates  
- **Loan creation** now sets `requested_usdc` = original request
- **Loan funding** will set `gross_usdc` = actual funded amount
- **Maintains backward compatibility** with existing data

### 3. TypeScript Types
Updated `Loan` type in `lib/supabase.ts` with clear comments.

## Usage Examples

### Track Funding Efficiency
```sql
SELECT 
  id,
  requested_usdc,
  gross_usdc,
  (gross_usdc / requested_usdc) * 100 as funding_percentage
FROM loans 
WHERE status = 'funded';
```

### Analytics Queries
```sql
-- Average funding rate
SELECT AVG(gross_usdc / requested_usdc) as avg_funding_rate
FROM loans WHERE gross_usdc IS NOT NULL;

-- Loans that got less than requested
SELECT * FROM loans 
WHERE gross_usdc < requested_usdc;

-- Total requested vs funded
SELECT 
  SUM(requested_usdc) as total_requested,
  SUM(gross_usdc) as total_funded
FROM loans;
```

## Benefits
1. **Clear tracking** of request vs settlement amounts
2. **Auction effectiveness** metrics  
3. **Borrower expectation** vs reality analysis
4. **Market efficiency** insights
5. **No breaking changes** to existing functionality

## Deployment
1. Run migration script to add the field
2. Deploy updated API code
3. Future loans will automatically track both amounts
4. Existing loans backfilled with current data

## Notes
- **Backward compatible** - existing loans work unchanged
- **Clean separation** - requested vs funded amounts are distinct
- **Ready for auctions** - supports dynamic funding amounts
- **Analytics ready** - easy to query and report on differences