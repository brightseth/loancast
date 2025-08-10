-- Migration to add listing_deleted_at column if it doesn't exist
-- This is safe to run multiple times - it will only add the column if it doesn't exist

-- Add the column if it doesn't exist
ALTER TABLE loans ADD COLUMN IF NOT EXISTS listing_deleted_at TIMESTAMPTZ;

-- Create an index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_loans_listing_deleted_at ON loans(listing_deleted_at) WHERE listing_deleted_at IS NOT NULL;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'loans' 
  AND column_name = 'listing_deleted_at';

-- Show success message
SELECT 'listing_deleted_at column is now available' AS status;