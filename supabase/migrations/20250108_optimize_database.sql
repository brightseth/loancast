-- Database optimization migration
-- Adds advanced indexes, query optimizations, and performance improvements

-- Drop existing basic indexes to recreate them optimized
DROP INDEX IF EXISTS idx_loans_borrower_fid;
DROP INDEX IF EXISTS idx_loans_lender_fid;
DROP INDEX IF EXISTS idx_loans_status;
DROP INDEX IF EXISTS idx_loans_due_ts;
DROP INDEX IF EXISTS idx_repayments_loan_id;

-- ============================================
-- ADVANCED COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================

-- Primary query patterns for loans list/explore page
CREATE INDEX idx_loans_status_created_at ON loans(status, created_at DESC);
CREATE INDEX idx_loans_status_due_ts ON loans(status, due_ts);

-- User-specific loan queries
CREATE INDEX idx_loans_borrower_status ON loans(borrower_fid, status, created_at DESC);
CREATE INDEX idx_loans_lender_status ON loans(lender_fid, status, created_at DESC) WHERE lender_fid IS NOT NULL;

-- Time-based queries for dashboard and analytics
CREATE INDEX idx_loans_created_at_status ON loans(created_at DESC, status);
CREATE INDEX idx_loans_due_ts_status ON loans(due_ts, status) WHERE status = 'open';

-- Repayment tracking and verification
CREATE INDEX idx_loans_repay_tracking ON loans(status, due_ts, updated_at) WHERE status IN ('open', 'funded');

-- Cast hash lookups (unique but add partial index for performance)
CREATE UNIQUE INDEX idx_loans_cast_hash_active ON loans(cast_hash) WHERE status != 'default';

-- ============================================
-- USER TABLE OPTIMIZATIONS
-- ============================================

-- Credit score and reputation queries
CREATE INDEX idx_users_credit_score ON users(credit_score DESC, total_loans DESC);
CREATE INDEX idx_users_reputation ON users(loans_repaid, total_borrowed DESC);
CREATE INDEX idx_users_activity ON users(updated_at DESC) WHERE total_loans > 0;

-- Social metrics for profile discovery
CREATE INDEX idx_users_social_metrics ON users(follower_count DESC, cast_count DESC) 
    WHERE follower_count IS NOT NULL;

-- ============================================
-- REPAYMENTS TABLE OPTIMIZATIONS
-- ============================================

-- Enhanced repayments index for verification
CREATE INDEX idx_repayments_loan_verification ON repayments(loan_id, verification_method, created_at DESC);
CREATE INDEX idx_repayments_tx_hash ON repayments(tx_hash);
CREATE INDEX idx_repayments_amount_time ON repayments(amount_usdc DESC, repaid_ts DESC);

-- ============================================
-- LOAN DEFAULTS TABLE OPTIMIZATIONS
-- ============================================

-- Grace period and reminder tracking
CREATE INDEX idx_loan_defaults_grace_period ON loan_defaults(grace_period_ends) WHERE final_status IS NULL;
CREATE INDEX idx_loan_defaults_reminders ON loan_defaults(reminder_sent, grace_period_ends) WHERE final_status IS NULL;

-- ============================================
-- PARTIAL INDEXES FOR SPECIFIC SCENARIOS
-- ============================================

-- Active loans that need attention
CREATE INDEX idx_loans_overdue ON loans(due_ts, borrower_fid) 
    WHERE status = 'open' AND due_ts < NOW();

-- Funded loans waiting for repayment
CREATE INDEX idx_loans_active_funded ON loans(lender_fid, due_ts, repay_usdc) 
    WHERE status = 'funded';

-- High-value loans for risk management
CREATE INDEX idx_loans_high_value ON loans(repay_usdc DESC, status, created_at DESC) 
    WHERE repay_usdc > 1000;

-- Recent activity for homepage
CREATE INDEX idx_loans_recent_activity ON loans(created_at DESC, status) 
    WHERE created_at > (NOW() - INTERVAL '7 days');

-- ============================================
-- STATISTICS AND ANALYTICS INDEXES
-- ============================================

-- Monthly/weekly statistics
CREATE INDEX idx_loans_stats_monthly ON loans(DATE_TRUNC('month', created_at), status);
CREATE INDEX idx_loans_stats_weekly ON loans(DATE_TRUNC('week', created_at), status);

-- APR and yield analysis
CREATE INDEX idx_loans_yield_analysis ON loans(yield_bps, repay_usdc, status, created_at);

-- ============================================
-- JSONB INDEXES FOR REPUTATION BADGES
-- ============================================

-- Reputation badges search (JSONB GIN index)
CREATE INDEX idx_users_reputation_badges ON users USING GIN(reputation_badges);

-- ============================================
-- QUERY OPTIMIZATION FUNCTIONS
-- ============================================

-- Function to get user loan summary efficiently
CREATE OR REPLACE FUNCTION get_user_loan_summary(user_fid BIGINT)
RETURNS TABLE (
    total_loans INT,
    active_loans INT,
    repaid_loans INT,
    total_borrowed NUMERIC,
    avg_loan_size NUMERIC,
    repayment_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INT as total_loans,
        COUNT(CASE WHEN l.status = 'open' THEN 1 END)::INT as active_loans,
        COUNT(CASE WHEN l.status = 'repaid' THEN 1 END)::INT as repaid_loans,
        COALESCE(SUM(l.net_usdc), 0) as total_borrowed,
        COALESCE(AVG(l.net_usdc), 0) as avg_loan_size,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN l.status = 'repaid' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100)
            ELSE 0 
        END as repayment_rate
    FROM loans l
    WHERE l.borrower_fid = user_fid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function for efficient loan list with filters
CREATE OR REPLACE FUNCTION get_filtered_loans(
    p_status TEXT DEFAULT NULL,
    p_borrower_fid BIGINT DEFAULT NULL,
    p_lender_fid BIGINT DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS SETOF loans AS $$
BEGIN
    RETURN QUERY
    SELECT l.*
    FROM loans l
    WHERE 
        (p_status IS NULL OR l.status = p_status)
        AND (p_borrower_fid IS NULL OR l.borrower_fid = p_borrower_fid)
        AND (p_lender_fid IS NULL OR l.lender_fid = p_lender_fid)
    ORDER BY l.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- MATERIALIZED VIEW FOR PLATFORM STATISTICS
-- ============================================

-- Create materialized view for expensive statistics queries
CREATE MATERIALIZED VIEW platform_stats AS
SELECT 
    -- Overall loan metrics
    COUNT(*) as total_loans,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as active_loans,
    COUNT(CASE WHEN status = 'funded' THEN 1 END) as funded_loans,
    COUNT(CASE WHEN status = 'repaid' THEN 1 END) as repaid_loans,
    COUNT(CASE WHEN status = 'default' THEN 1 END) as defaulted_loans,
    
    -- Financial metrics
    COALESCE(SUM(net_usdc), 0) as total_volume,
    COALESCE(AVG(net_usdc), 0) as avg_loan_size,
    COALESCE(SUM(CASE WHEN status = 'repaid' THEN repay_usdc ELSE 0 END), 0) as total_repaid,
    
    -- Performance metrics
    CASE 
        WHEN COUNT(*) > 0 THEN 
            (COUNT(CASE WHEN status = 'repaid' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100)
        ELSE 0 
    END as repayment_rate,
    
    -- Yield metrics
    AVG(yield_bps) as avg_yield_bps,
    
    -- Time-based metrics
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '24 hours' THEN 1 END) as loans_24h,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as loans_7d,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as loans_30d,
    
    -- Risk metrics
    COUNT(CASE WHEN status = 'open' AND due_ts < NOW() THEN 1 END) as overdue_loans,
    
    -- Update timestamp
    NOW() as updated_at
FROM loans;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_platform_stats_updated ON platform_stats(updated_at);

-- Function to refresh stats (call this periodically)
CREATE OR REPLACE FUNCTION refresh_platform_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY platform_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VACUUM AND ANALYZE OPTIMIZATIONS
-- ============================================

-- Set better autovacuum settings for high-traffic tables
ALTER TABLE loans SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_limit = 1000
);

ALTER TABLE users SET (
    autovacuum_vacuum_scale_factor = 0.15,
    autovacuum_analyze_scale_factor = 0.1
);

-- ============================================
-- PERFORMANCE MONITORING
-- ============================================

-- View for monitoring slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- ============================================
-- CONSTRAINTS AND VALIDATIONS
-- ============================================

-- Add constraint to ensure loan amounts are reasonable
ALTER TABLE loans ADD CONSTRAINT check_loan_amounts 
    CHECK (repay_usdc > 0 AND repay_usdc <= 50000);

-- Add constraint for yield bounds
ALTER TABLE loans ADD CONSTRAINT check_yield_bounds
    CHECK (yield_bps >= 100 AND yield_bps <= 10000); -- 1% to 100% APR

-- Add constraint for due date
ALTER TABLE loans ADD CONSTRAINT check_due_date
    CHECK (due_ts > start_ts);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_loans_status_created_at IS 'Primary index for loan list queries filtered by status';
COMMENT ON INDEX idx_loans_borrower_status IS 'Optimized index for user loan history queries';
COMMENT ON INDEX idx_loans_overdue IS 'Partial index for identifying overdue loans';
COMMENT ON FUNCTION get_user_loan_summary IS 'Efficient function to get user loan statistics';
COMMENT ON MATERIALIZED VIEW platform_stats IS 'Cached platform statistics updated periodically';

-- Update table statistics
ANALYZE loans;
ANALYZE users; 
ANALYZE repayments;
ANALYZE loan_defaults;