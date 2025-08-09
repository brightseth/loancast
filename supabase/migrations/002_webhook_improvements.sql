-- Webhook improvements for production safety
-- Based on security feedback to prevent webhook abuse and ensure data consistency

-- 1. Webhook inbox for idempotency and event ordering
CREATE TABLE webhook_inbox (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  cast_hash text,
  payload jsonb NOT NULL,
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  INDEX idx_webhook_inbox_type ON webhook_inbox(type),
  INDEX idx_webhook_inbox_received ON webhook_inbox(received_at),
  INDEX idx_webhook_inbox_processed ON webhook_inbox(processed_at) WHERE processed_at IS NOT NULL
);

-- 2. Loan events for audit trail
CREATE TABLE loan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  kind text NOT NULL, -- 'created', 'funded', 'repaid', 'deleted', 'cast_deleted', etc.
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  INDEX idx_loan_events_loan_id ON loan_events(loan_id),
  INDEX idx_loan_events_kind ON loan_events(kind),
  INDEX idx_loan_events_created_at ON loan_events(created_at)
);

-- 3. Bid proposals for discovery (NOT funding truth)
CREATE TABLE bid_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  proposer_fid bigint NOT NULL,
  amount_usdc decimal(10,2), -- nullable, parsed from text
  cast_hash text NOT NULL,
  reply_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  INDEX idx_bid_proposals_loan_id ON bid_proposals(loan_id),
  INDEX idx_bid_proposals_proposer ON bid_proposals(proposer_fid),
  INDEX idx_bid_proposals_created_at ON bid_proposals(created_at),
  -- Prevent duplicate proposals from same cast
  UNIQUE(cast_hash)
);

-- 4. Add missing columns to loans table for proper funding attribution
ALTER TABLE loans ADD COLUMN IF NOT EXISTS fund_event_id text;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS lender_addr text;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS principal_usdc decimal(10,2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS listing_deleted_at timestamptz;

-- 5. Create index for webhook performance
CREATE INDEX IF NOT EXISTS idx_loans_cast_hash ON loans(cast_hash);

-- 6. Add webhook rate limiting table
CREATE TABLE webhook_rate_limits (
  fid bigint NOT NULL,
  event_type text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  PRIMARY KEY (fid, event_type, window_start),
  INDEX idx_webhook_rate_limits_window ON webhook_rate_limits(window_start)
);

-- 7. Function to clean old webhook data
CREATE OR REPLACE FUNCTION clean_webhook_data() RETURNS void AS $$
BEGIN
  -- Clean processed webhook inbox older than 7 days
  DELETE FROM webhook_inbox 
  WHERE processed_at IS NOT NULL 
  AND processed_at < now() - interval '7 days';
  
  -- Clean rate limiting data older than 1 hour
  DELETE FROM webhook_rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 8. Add RLS policies for new tables (security)
ALTER TABLE webhook_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook tables
CREATE POLICY "Service role only" ON webhook_inbox FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON loan_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON webhook_rate_limits FOR ALL USING (auth.role() = 'service_role');

-- Bid proposals can be read by authenticated users for discovery
CREATE POLICY "Authenticated users can read bids" ON bid_proposals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role can manage bids" ON bid_proposals FOR ALL USING (auth.role() = 'service_role');