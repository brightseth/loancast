-- Security & Integrity Improvements based on code review
-- Run this migration to fix critical security issues

-- 1. Add missing columns to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS origin_cast_hash TEXT REFERENCES loans(cast_hash),
ADD COLUMN IF NOT EXISTS lender_addr TEXT, -- Blockchain address, not just FID
ADD COLUMN IF NOT EXISTS principal_usdc BIGINT, -- Use bigint for precise math
ADD COLUMN IF NOT EXISTS repay_expected_usdc BIGINT,
ADD COLUMN IF NOT EXISTS fund_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS verified_funding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_repayment BOOLEAN DEFAULT FALSE;

-- 2. Create loan status transitions audit table
CREATE TABLE IF NOT EXISTS loan_status_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    reason TEXT,
    triggered_by TEXT, -- 'system', 'user', 'cron', 'webhook'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create sent notifications tracking (prevent spam)
CREATE TABLE IF NOT EXISTS sent_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    kind TEXT NOT NULL, -- 'reminder_3d', 'reminder_1d', 'overdue', etc.
    bucket_date DATE NOT NULL, -- For deduplication
    recipient_fid BIGINT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(loan_id, kind, bucket_date)
);

-- 4. Add unique constraint to prevent double-crediting repayments
ALTER TABLE repayments 
ADD COLUMN IF NOT EXISTS from_addr TEXT,
ADD COLUMN IF NOT EXISTS to_addr TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Make tx_hash unique to prevent replay attacks
ALTER TABLE repayments 
ADD CONSTRAINT repayments_tx_hash_unique UNIQUE (tx_hash);

-- 5. Create reputation events table for audit trail
CREATE TABLE IF NOT EXISTS reputation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fid BIGINT NOT NULL,
    delta INTEGER NOT NULL, -- Positive or negative change
    reason TEXT NOT NULL,
    loan_id UUID REFERENCES loans(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add critical indexes
CREATE INDEX IF NOT EXISTS idx_loans_status_due ON loans(status, due_ts);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_status ON loans(borrower_fid, status);
CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_tx_hash ON repayments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_status_transitions_loan ON loan_status_transitions(loan_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reputation_events_fid ON reputation_events(fid, created_at);

-- 7. Update status constraint to include all valid states
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;
ALTER TABLE loans 
ADD CONSTRAINT loans_status_check 
CHECK (status IN ('seeking', 'funded', 'due', 'overdue', 'default', 'repaid', 'cancelled', 'deleted'));

-- 8. Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- IP address or FID
    endpoint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- 9. Row Level Security Policies
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_status_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

-- Public read access to basic loan info (for explore page)
CREATE POLICY "Public can view active loans" ON loans
    FOR SELECT USING (status IN ('seeking', 'funded') AND deleted_at IS NULL);

-- Borrowers can update their own loans only when seeking
CREATE POLICY "Borrowers can update seeking loans" ON loans
    FOR UPDATE USING (
        borrower_fid = (current_setting('app.current_user_fid'))::bigint 
        AND status = 'seeking'
    );

-- Only system can transition loan states after funding
CREATE POLICY "System can update loan status" ON loans
    FOR UPDATE USING (current_user = 'service_role');

-- Users can view their own reputation events
CREATE POLICY "Users can view own reputation" ON reputation_events
    FOR SELECT USING (fid = (current_setting('app.current_user_fid'))::bigint);

-- Add function to safely transition loan status
CREATE OR REPLACE FUNCTION transition_loan_status(
    loan_id_param UUID,
    new_status TEXT,
    reason TEXT DEFAULT NULL,
    triggered_by_param TEXT DEFAULT 'system'
) RETURNS BOOLEAN AS $$
DECLARE
    current_loan RECORD;
    valid_transition BOOLEAN := FALSE;
BEGIN
    -- Get current loan
    SELECT * INTO current_loan FROM loans WHERE id = loan_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found: %', loan_id_param;
    END IF;
    
    -- Validate transition (simplified - add full state machine)
    CASE current_loan.status
        WHEN 'seeking' THEN
            valid_transition := new_status IN ('funded', 'cancelled', 'deleted');
        WHEN 'funded' THEN
            valid_transition := new_status IN ('due', 'repaid', 'overdue');
        WHEN 'due' THEN
            valid_transition := new_status IN ('repaid', 'overdue');
        WHEN 'overdue' THEN
            valid_transition := new_status IN ('repaid', 'default');
        ELSE
            valid_transition := FALSE;
    END CASE;
    
    IF NOT valid_transition THEN
        RAISE EXCEPTION 'Invalid status transition from % to %', current_loan.status, new_status;
    END IF;
    
    -- Record the transition
    INSERT INTO loan_status_transitions (loan_id, from_status, to_status, reason, triggered_by)
    VALUES (loan_id_param, current_loan.status, new_status, reason, triggered_by_param);
    
    -- Update the loan
    UPDATE loans 
    SET status = new_status, updated_at = NOW()
    WHERE id = loan_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;