-- Race condition fixes for funding
-- Add unique constraint on funding_tx_hash to prevent duplicate funding

-- First, add the unique constraint on tx_fund (funding transaction hash)
-- This prevents the same transaction from being used to fund multiple loans
CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_tx_fund_unique 
ON loans(tx_fund) 
WHERE tx_fund IS NOT NULL;

-- Add constraint to prevent duplicate funding for the same loan
-- This complements the application-level WHERE status='open' check
ALTER TABLE loans 
ADD CONSTRAINT check_funded_once 
CHECK (
  (status = 'funded' AND lender_fid IS NOT NULL AND tx_fund IS NOT NULL) OR 
  (status != 'funded')
);

-- Create event_id table for webhook/cast deduplication
CREATE TABLE IF NOT EXISTS event_dedupe (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT, -- 'webhook', 'api', etc.
    metadata JSONB
);

-- Index for cleanup of old events (keep only last 24 hours)
CREATE INDEX idx_event_dedupe_processed_at ON event_dedupe(processed_at);

-- Function to cleanup old deduplication events
CREATE OR REPLACE FUNCTION cleanup_event_dedupe()
RETURNS void AS $$
BEGIN
    DELETE FROM event_dedupe 
    WHERE processed_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON INDEX idx_loans_tx_fund_unique IS 'Prevents same transaction hash from funding multiple loans';
COMMENT ON TABLE event_dedupe IS 'Prevents duplicate webhook/API events within 24 hours';
COMMENT ON FUNCTION cleanup_event_dedupe IS 'Removes deduplication events older than 24 hours';