-- Add fields for cast collection funding mechanism
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS funding_method TEXT DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS collection_amount_usd NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS funded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS funding_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status check constraint to include new statuses
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;
ALTER TABLE loans 
ADD CONSTRAINT loans_status_check 
CHECK (status IN ('open', 'funded', 'repaid', 'default', 'deleted', 'cancelled'));

-- Add index for funded loans
CREATE INDEX IF NOT EXISTS idx_loans_funded_at ON loans(funded_at);
CREATE INDEX IF NOT EXISTS idx_loans_funding_method ON loans(funding_method);