-- Verification script for listing_deleted_at column
-- Run this in your Supabase SQL editor to check if the column exists

-- 1. Check if listing_deleted_at column exists in loans table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'loans' 
  AND column_name = 'listing_deleted_at';

-- If the above query returns no rows, the column doesn't exist.
-- If it returns one row, the column exists.

-- 2. Get complete loans table schema for reference
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'loans'
ORDER BY ordinal_position;

-- 3. Check if any loans currently have listing_deleted_at set (only works if column exists)
-- Uncomment the following line if the column exists:
-- SELECT COUNT(*) as loans_with_deleted_timestamp FROM loans WHERE listing_deleted_at IS NOT NULL;