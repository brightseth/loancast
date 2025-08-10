-- Create webhook infrastructure tables for Neynar webhook handling
-- Run this in your Supabase Dashboard SQL Editor

-- 1. Webhook inbox for idempotency and event ordering
CREATE TABLE IF NOT EXISTS webhook_inbox (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  cast_hash text,
  payload jsonb NOT NULL,
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- 2. Loan events for audit trail
CREATE TABLE IF NOT EXISTS loan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  kind text NOT NULL, -- 'created', 'funded', 'repaid', 'deleted', 'cast_deleted', etc.
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 3. Webhook rate limiting table
CREATE TABLE IF NOT EXISTS webhook_rate_limits (
  fid bigint NOT NULL,
  event_type text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  PRIMARY KEY (fid, event_type, window_start)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_inbox_type ON webhook_inbox(type);
CREATE INDEX IF NOT EXISTS idx_webhook_inbox_received ON webhook_inbox(received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_inbox_processed ON webhook_inbox(processed_at) WHERE processed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_loan_events_loan_id ON loan_events(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_events_kind ON loan_events(kind);
CREATE INDEX IF NOT EXISTS idx_loan_events_created_at ON loan_events(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window ON webhook_rate_limits(window_start);

-- 5. Enable RLS for security
ALTER TABLE webhook_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;

-- 6. Create policies (only service role can access webhook tables)
CREATE POLICY "Service role only" ON webhook_inbox FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON loan_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON webhook_rate_limits FOR ALL USING (auth.role() = 'service_role');

-- 7. Success message
SELECT 'Webhook tables created successfully!' as status;