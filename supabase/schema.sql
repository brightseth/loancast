-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create loans table
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cast_hash TEXT UNIQUE NOT NULL,
    borrower_fid BIGINT NOT NULL,
    lender_fid BIGINT,
    gross_usdc NUMERIC(18,2),
    net_usdc NUMERIC(18,2),
    yield_bps SMALLINT NOT NULL,
    repay_usdc NUMERIC(18,2) NOT NULL,
    start_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_ts TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'repaid', 'default')),
    tx_fund TEXT,
    tx_repay TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create repayments table with enhanced verification
CREATE TABLE repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    tx_hash TEXT NOT NULL,
    amount_usdc NUMERIC(18,2) NOT NULL,
    block_number BIGINT,
    verification_method TEXT DEFAULT 'onchain_base',
    repaid_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create loan_defaults table for grace period tracking
CREATE TABLE loan_defaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    grace_period_ends TIMESTAMPTZ NOT NULL,
    reminder_sent BOOLEAN DEFAULT FALSE,
    warning_cast_hash TEXT,
    final_status TEXT CHECK (final_status IN ('repaid', 'defaulted', 'arbitration')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table with enhanced reputation tracking
CREATE TABLE users (
    fid BIGINT PRIMARY KEY,
    display_name TEXT,
    pfp_url TEXT,
    credit_score INT DEFAULT 0 CHECK (credit_score >= 0 AND credit_score <= 100),
    total_loans INT DEFAULT 0,
    loans_repaid INT DEFAULT 0,
    loans_defaulted INT DEFAULT 0,
    total_borrowed NUMERIC(18,2) DEFAULT 0,
    total_repaid NUMERIC(18,2) DEFAULT 0,
    avg_repayment_days NUMERIC(5,2),
    repayment_streak INT DEFAULT 0,
    follower_count INT,
    cast_count INT,
    account_created_at TIMESTAMPTZ,
    verified_wallet TEXT,
    reputation_badges JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_loans_borrower_fid ON loans(borrower_fid);
CREATE INDEX idx_loans_lender_fid ON loans(lender_fid);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_ts ON loans(due_ts);
CREATE INDEX idx_repayments_loan_id ON repayments(loan_id);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for loans
CREATE POLICY "Public can read all loans" ON loans
    FOR SELECT USING (true);

CREATE POLICY "Borrowers can insert their own loans" ON loans
    FOR INSERT WITH CHECK (auth.uid()::text = borrower_fid::text);

CREATE POLICY "Borrowers can update their own loans" ON loans
    FOR UPDATE USING (auth.uid()::text = borrower_fid::text);

-- Policies for repayments
CREATE POLICY "Public can read all repayments" ON repayments
    FOR SELECT USING (true);

CREATE POLICY "Borrowers can insert repayments for their loans" ON repayments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM loans
            WHERE loans.id = loan_id
            AND loans.borrower_fid::text = auth.uid()::text
        )
    );

-- Policies for users
CREATE POLICY "Public can read all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = fid::text);