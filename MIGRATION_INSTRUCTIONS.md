# Database Migration Required: listing_deleted_at Column

## Current Issue
The `listing_deleted_at` column does **NOT exist** in the production database. This is why the loan filtering isn't working - the API deployment completed successfully, but the database schema is missing the required column.

## Verification Results
- ❌ `listing_deleted_at` column is missing from the `loans` table
- 🔍 API currently returns 2 loans (including the one that should be deleted)
- 🎯 Target loan ID: `9abed685-639c-44ce-b811-c83e897d94dd` is still appearing in API results

## Required Action: Run Database Migration

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/qvafjicbrsoyzdlgypuq/sql/new
2. This will open the SQL Editor in your Supabase Dashboard

### Step 2: Run Migration SQL
Copy and paste this exact SQL into the editor:

```sql
-- Add the missing column
ALTER TABLE loans ADD COLUMN IF NOT EXISTS listing_deleted_at TIMESTAMPTZ;

-- Create index for performance  
CREATE INDEX IF NOT EXISTS idx_loans_listing_deleted_at ON loans(listing_deleted_at) WHERE listing_deleted_at IS NOT NULL;

-- Verify column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'loans' 
  AND column_name = 'listing_deleted_at';

-- Success message
SELECT 'listing_deleted_at column migration completed' AS status;
```

### Step 3: Execute Migration
1. Click the "Run" button in the Supabase SQL Editor
2. Verify you see the success message

### Step 4: Verify Migration
Run this command to verify the column was added:
```bash
node check-database-simple.js
```

Expected result: Should show the column exists and display current loan states.

### Step 5: Test API Response
After migration, test the API:
```bash
curl "https://loancast.app/api/loans" | jq length
```

**Expected behavior after migration:**
- If the webhook had previously tried to mark loan `9abed685-639c-44ce-b811-c83e897d94dd` as deleted, it may need to be triggered again
- The column will exist but all current loans will have `listing_deleted_at = NULL` initially
- You may need to manually update the target loan or re-trigger the webhook

### Step 6: Update Target Loan (if needed)
If the loan should be marked as deleted, run this SQL:
```sql
UPDATE loans 
SET listing_deleted_at = NOW() 
WHERE id = '9abed685-639c-44ce-b811-c83e897d94dd';
```

## File References
- Migration SQL: `/Users/seth/loancast/add-listing-deleted-at.sql`
- Verification Script: `/Users/seth/loancast/check-database-simple.js`
- API Endpoint: `/Users/seth/loancast/app/api/loans/route.ts` (lines 193, 206-208)

## Current Database Connection
- URL: https://qvafjicbrsoyzdlgypuq.supabase.co
- Service Key: Available in `.env.local`

## Why This Happened
The API code was deployed with the filtering logic for `listing_deleted_at`, but the database schema was never updated to include the actual column. This is a common deployment issue where code and database changes are not synchronized.