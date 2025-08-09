-- Database functions for secure repayment processing

-- Create repayment intents table
CREATE TABLE IF NOT EXISTS repayment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    borrower_addr TEXT NOT NULL,
    lender_addr TEXT NOT NULL,
    expected_amount TEXT NOT NULL, -- bigint as string
    status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'completed', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(loan_id, status) -- Only one active intent per loan
);

-- Atomic repayment processing function
CREATE OR REPLACE FUNCTION process_repayment(
    loan_id_param UUID,
    tx_hash_param TEXT,
    from_addr_param TEXT,
    to_addr_param TEXT,
    amount_param TEXT,
    block_number_param INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_loan RECORD;
    repayment_id UUID;
BEGIN
    -- Start transaction
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
    PERFORM 1 FROM repayments WHERE tx_hash = tx_hash_param;
    IF FOUND THEN
        RAISE EXCEPTION 'Transaction already processed: %', tx_hash_param;
    END IF;
    
    -- Insert repayment record
    INSERT INTO repayments (
        loan_id,
        tx_hash,
        from_addr,
        to_addr,
        amount_usdc,
        block_number,
        verified,
        created_at
    ) VALUES (
        loan_id_param,
        tx_hash_param,
        from_addr_param,
        to_addr_param,
        amount_param::bigint,
        block_number_param,
        TRUE,
        NOW()
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
        loan_id,
        from_status,
        to_status,
        reason,
        triggered_by,
        metadata
    ) VALUES (
        loan_id_param,
        current_loan.status,
        'repaid',
        'Repayment confirmed on-chain',
        'system',
        json_build_object(
            'tx_hash', tx_hash_param,
            'amount', amount_param,
            'block_number', block_number_param
        )
    );
    
    -- Update borrower reputation
    INSERT INTO reputation_events (
        fid,
        delta,
        reason,
        loan_id,
        metadata
    ) VALUES (
        current_loan.borrower_fid,
        10, -- Positive reputation for repayment
        'loan_repaid_on_time',
        loan_id_param,
        json_build_object(
            'amount', amount_param,
            'days_early', EXTRACT(DAY FROM (current_loan.due_ts - NOW()))
        )
    );
    
    -- Mark repayment intent as completed
    UPDATE repayment_intents 
    SET status = 'completed'
    WHERE loan_id = loan_id_param AND status = 'initiated';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and expire old repayment intents
CREATE OR REPLACE FUNCTION expire_repayment_intents() RETURNS INTEGER AS $$
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

-- Function to safely update notification deduplication
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