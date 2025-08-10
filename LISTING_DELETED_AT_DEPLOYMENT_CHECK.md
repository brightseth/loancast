# Listing Deleted At Column - Deployment Checklist

## Summary

The `listing_deleted_at` column is used by the webhook system to mark loans as deleted when their corresponding Farcaster casts are deleted. This prevents deleted loan requests from appearing in the public API.

## Database Schema Status

### ✅ Migration Available
The `listing_deleted_at` column is defined in:
- **File**: `supabase/migrations/002_webhook_improvements.sql` 
- **Line**: 49
- **SQL**: `ALTER TABLE loans ADD COLUMN IF NOT EXISTS listing_deleted_at timestamptz;`

### ✅ Code Updated
The following files have been updated to support the column:

1. **TypeScript Types** (`lib/supabase.ts`)
   - Added `listing_deleted_at: string | null` to Loan type

2. **API Endpoints**:
   - **GET /api/loans**: Now includes `listing_deleted_at` in select and filters out deleted loans by default
   - **GET /api/loans/[id]**: Already handles deleted loans (returns 404)
   - **Webhook /api/webhooks/neynar**: Already sets `listing_deleted_at` timestamp

## Pre-Deployment Steps

### 1. Verify Column Exists in Production

Run this query in your Supabase SQL editor:

```sql
-- Check if listing_deleted_at column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'loans' 
  AND column_name = 'listing_deleted_at';
```

**Expected Result:**
- If column exists: Returns 1 row showing `listing_deleted_at | timestamptz | YES | null`
- If column missing: Returns 0 rows

### 2. Add Column if Missing

If the column doesn't exist, run this migration:

```sql
-- Safe migration - can be run multiple times
ALTER TABLE loans ADD COLUMN IF NOT EXISTS listing_deleted_at TIMESTAMPTZ;

-- Optional performance index
CREATE INDEX IF NOT EXISTS idx_loans_listing_deleted_at 
ON loans(listing_deleted_at) 
WHERE listing_deleted_at IS NOT NULL;
```

### 3. Verify Current Data

Check if any loans are currently marked as deleted:

```sql
-- Count deleted listings
SELECT COUNT(*) as deleted_count FROM loans WHERE listing_deleted_at IS NOT NULL;

-- Show deleted listings (if any)
SELECT id, cast_hash, status, listing_deleted_at 
FROM loans 
WHERE listing_deleted_at IS NOT NULL 
ORDER BY listing_deleted_at DESC;
```

## API Behavior Changes

### GET /api/loans
- **Before**: Returned all loans regardless of deletion status
- **After**: Excludes loans where `listing_deleted_at IS NOT NULL` by default
- **Override**: Use `?include_deleted=true` to include deleted loans

### GET /api/loans/[id]  
- **Behavior**: Returns 404 for deleted loans (no change)

### Webhook Processing
- **Behavior**: Sets `listing_deleted_at` timestamp when cast is deleted (no change)

## Testing Checklist

- [ ] Database connection works
- [ ] Column exists or migration runs successfully
- [ ] GET /api/loans excludes deleted loans
- [ ] GET /api/loans?include_deleted=true includes deleted loans
- [ ] GET /api/loans/[deleted-id] returns 404
- [ ] Webhook can set listing_deleted_at timestamp
- [ ] No TypeScript errors in build
- [ ] All tests pass

## Rollback Plan

If issues occur, you can:

1. **Revert API filters** by removing the `listing_deleted_at` filter:
   ```typescript
   // Remove this line from loans/route.ts
   if (!validatedQuery.include_deleted) {
     query = query.is('listing_deleted_at', null)
   }
   ```

2. **Keep column** - The column is safe to keep even if unused
3. **Drop column** (only if absolutely necessary):
   ```sql
   ALTER TABLE loans DROP COLUMN IF EXISTS listing_deleted_at;
   ```

## Files Modified

- ✅ `/lib/supabase.ts` - Added field to Loan type
- ✅ `/app/api/loans/route.ts` - Added column to select and filter logic
- ✅ Created `/verify-listing-deleted-at.sql` - Database verification script
- ✅ Created `/add-listing-deleted-at.sql` - Migration script

## Risk Assessment

**Low Risk** - The changes are backwards compatible:
- Column is nullable, won't affect existing loans
- API filters are additive (exclude deleted by default)
- Individual loan endpoint already handled this column
- Migration uses `IF NOT EXISTS` for safety

**Recommendation**: Safe to deploy after verifying column exists in production database.