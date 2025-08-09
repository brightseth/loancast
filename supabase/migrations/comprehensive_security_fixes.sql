-- Comprehensive Security and Stability Fixes
-- Based on code review feedback + security audit

-- 1. Add missing loan columns for repayment verification
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS origin_cast_hash TEXT,
  ADD COLUMN IF NOT EXISTS borrower_addr TEXT,
  ADD COLUMN IF NOT EXISTS lender_addr TEXT,
  ADD COLUMN IF NOT EXISTS repay_expected_usdc BIGINT;

-- 2. Create repayments table with unique constraint
CREATE TABLE IF NOT EXISTS repayments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL,
  from_addr TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  amount_usdc BIGINT NOT NULL,
  block_number INTEGER,
  block_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tx_hash)
);

-- 3. Status transitions table
CREATE TABLE IF NOT EXISTS loan_status_transitions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reason TEXT,
  triggered_by TEXT DEFAULT 'system',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Notification deduplication table
CREATE TABLE IF NOT EXISTS sent_notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'due_24h' | 'due_2h' | 'overdue' | 'repaid' | etc
  bucket_date DATE NOT NULL,
  recipient_fid BIGINT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loan_id, kind, bucket_date)
);

-- 5. Repayment intents table (for secure repayment flow)
CREATE TABLE IF NOT EXISTS repayment_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  borrower_addr TEXT NOT NULL,
  lender_addr TEXT NOT NULL,
  expected_amount BIGINT NOT NULL,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'completed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(loan_id, status) -- Only one active intent per loan
);

-- 6. Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or FID
  endpoint TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Reputation events table
CREATE TABLE IF NOT EXISTS reputation_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fid BIGINT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loans_status_due ON loans(status, due_ts) WHERE status IN ('funded', 'due', 'overdue');
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_fid);
CREATE INDEX IF NOT EXISTS idx_loans_lender ON loans(lender_fid);
CREATE INDEX IF NOT EXISTS idx_repayments_loan ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_tx_hash ON repayments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_status_transitions_loan ON loan_status_transitions(loan_id);
CREATE INDEX IF NOT EXISTS idx_sent_notifications_lookup ON sent_notifications(loan_id, kind, bucket_date);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_reputation_fid ON reputation_events(fid);

-- 9. Atomic repayment processing function
CREATE OR REPLACE FUNCTION process_repayment(
  loan_id_param UUID,
  tx_hash_param TEXT,
  from_addr_param TEXT,
  to_addr_param TEXT,
  amount_param BIGINT,
  block_number_param INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  current_loan RECORD;
  repayment_id BIGINT;
  result JSONB;
BEGIN
  -- Get current loan with lock
  SELECT * INTO current_loan 
  FROM loans 
  WHERE id = loan_id_param 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found: %', loan_id_param;
  END IF;
  
  -- Verify loan can be repaid
  IF current_loan.status NOT IN ('funded', 'due', 'overdue') THEN
    RAISE EXCEPTION 'Cannot repay loan in status: %', current_loan.status;
  END IF;
  
  -- Check for duplicate transaction
  IF EXISTS (SELECT 1 FROM repayments WHERE tx_hash = tx_hash_param) THEN
    RAISE EXCEPTION 'Transaction already processed: %', tx_hash_param;
  END IF;
  
  -- Insert repayment record
  INSERT INTO repayments (
    loan_id, tx_hash, from_addr, to_addr, amount_usdc, block_number, verified
  ) VALUES (
    loan_id_param, tx_hash_param, from_addr_param, to_addr_param, 
    amount_param, block_number_param, TRUE
  ) RETURNING id INTO repayment_id;
  
  -- Update loan status to repaid
  UPDATE loans SET
    status = 'repaid',
    repay_tx_hash = tx_hash_param,
    verified_repayment = TRUE,
    updated_at = NOW()
  WHERE id = loan_id_param;
  
  -- Record status transition
  INSERT INTO loan_status_transitions (
    loan_id, from_status, to_status, reason, triggered_by, metadata
  ) VALUES (
    loan_id_param, current_loan.status, 'repaid', 
    'Repayment confirmed on-chain', 'system',
    jsonb_build_object(
      'tx_hash', tx_hash_param,
      'amount', amount_param,
      'block_number', block_number_param,
      'repayment_id', repayment_id
    )
  );
  
  -- Update borrower reputation
  INSERT INTO reputation_events (
    fid, delta, reason, loan_id, metadata
  ) VALUES (
    current_loan.borrower_fid, 10, 'loan_repaid_on_time', loan_id_param,
    jsonb_build_object(
      'amount', amount_param,
      'days_early', EXTRACT(DAY FROM (current_loan.due_ts - NOW()))
    )
  );
  
  -- Mark repayment intent as completed
  UPDATE repayment_intents 
  SET status = 'completed'
  WHERE loan_id = loan_id_param AND status = 'initiated';
  
  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'repayment_id', repayment_id,
    'loan_id', loan_id_param,
    'status', 'repaid'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Safe status transition function
CREATE OR REPLACE FUNCTION transition_loan_status(
  loan_id_param UUID,
  new_status_param TEXT,
  reason_param TEXT DEFAULT NULL,
  triggered_by_param TEXT DEFAULT 'system'
) RETURNS BOOLEAN AS $$
DECLARE
  current_status TEXT;
  valid_transitions TEXT[][] := ARRAY[
    ARRAY['seeking', 'funded'],
    ARRAY['seeking', 'expired'],
    ARRAY['funded', 'due'],
    ARRAY['funded', 'repaid'],
    ARRAY['due', 'overdue'],
    ARRAY['due', 'repaid'],
    ARRAY['overdue', 'defaulted'],
    ARRAY['overdue', 'repaid']
  ];
  transition_pair TEXT[];
BEGIN
  -- Get current status
  SELECT status INTO current_status FROM loans WHERE id = loan_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found: %', loan_id_param;
  END IF;
  
  -- Check if transition is allowed
  transition_pair := ARRAY[current_status, new_status_param];
  
  IF transition_pair != ANY(valid_transitions) AND current_status != new_status_param THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', current_status, new_status_param;
  END IF;
  
  -- Skip if already in target status
  IF current_status = new_status_param THEN
    RETURN FALSE;
  END IF;
  
  -- Update loan status
  UPDATE loans SET 
    status = new_status_param,
    updated_at = NOW()
  WHERE id = loan_id_param;
  
  -- Record transition
  INSERT INTO loan_status_transitions (
    loan_id, from_status, to_status, reason, triggered_by
  ) VALUES (
    loan_id_param, current_status, new_status_param, 
    reason_param, triggered_by_param
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Notification deduplication function
CREATE OR REPLACE FUNCTION record_notification_sent(
  loan_id_param UUID,
  kind_param TEXT,
  recipient_fid_param BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
  bucket_date_param DATE := CURRENT_DATE;
BEGIN
  INSERT INTO sent_notifications (loan_id, kind, bucket_date, recipient_fid)
  VALUES (loan_id_param, kind_param, bucket_date_param, recipient_fid_param)
  ON CONFLICT (loan_id, kind, bucket_date) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Cleanup functions
CREATE OR REPLACE FUNCTION cleanup_expired_intents() RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE repayment_intents 
  SET status = 'expired'
  WHERE status = 'initiated' AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Row Level Security Policies
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_status_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

-- Public read-only access to loan summary data
CREATE POLICY "Public can view loan summaries" ON loans
  FOR SELECT USING (true);

-- Borrowers can insert and update loans in early stages
CREATE POLICY "Borrowers can manage early-stage loans" ON loans
  FOR ALL USING (
    auth.uid()::text = borrower_fid::text AND 
    status IN ('seeking', 'draft')
  );

-- Service role can do everything (for cron/webhooks)
CREATE POLICY "Service role full access" ON loans
  FOR ALL TO service_role USING (true);

-- Similar policies for other tables
CREATE POLICY "Public can view repayments" ON repayments
  FOR SELECT USING (true);

CREATE POLICY "Service role manages repayments" ON repayments
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages transitions" ON loan_status_transitions
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages notifications" ON sent_notifications
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages intents" ON repayment_intents
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages rate limits" ON rate_limits
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages reputation" ON reputation_events
  FOR ALL TO service_role USING (true);