-- Drop existing tables if they exist
DROP TABLE IF EXISTS loan_defaults CASCADE;
DROP TABLE IF EXISTS repayments CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create loans table (simplified)
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
    status TEXT DEFAULT 'open',
    tx_fund TEXT,
    tx_repay TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (simplified)
CREATE TABLE users (
    fid BIGINT PRIMARY KEY,
    display_name TEXT,
    pfp_url TEXT,
    credit_score INT DEFAULT 0,
    total_loans INT DEFAULT 0,
    loans_repaid INT DEFAULT 0,
    loans_defaulted INT DEFAULT 0,
    total_borrowed NUMERIC(18,2) DEFAULT 0,
    follower_count INT,
    cast_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create repayments table (simplified)
CREATE TABLE repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    tx_hash TEXT NOT NULL,
    amount_usdc NUMERIC(18,2) NOT NULL,
    repaid_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NO RLS for development
-- This makes it work without authentication issues