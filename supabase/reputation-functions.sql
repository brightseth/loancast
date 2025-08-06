-- Function to get comprehensive user loan statistics
CREATE OR REPLACE FUNCTION get_user_loan_stats(p_user_fid BIGINT)
RETURNS TABLE (
  total_loans INTEGER,
  loans_repaid INTEGER,
  loans_defaulted INTEGER,
  total_borrowed NUMERIC,
  total_lent NUMERIC,
  repayment_streak INTEGER,
  avg_repayment_days NUMERIC,
  earliest_loan TIMESTAMP WITH TIME ZONE,
  account_age_months INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Borrowed loan stats
    COALESCE(borrowed.total_loans, 0)::INTEGER,
    COALESCE(borrowed.loans_repaid, 0)::INTEGER, 
    COALESCE(borrowed.loans_defaulted, 0)::INTEGER,
    COALESCE(borrowed.total_borrowed, 0)::NUMERIC,
    
    -- Lent loan stats
    COALESCE(lent.total_lent, 0)::NUMERIC,
    
    -- Repayment metrics
    COALESCE(borrowed.repayment_streak, 0)::INTEGER,
    borrowed.avg_repayment_days,
    borrowed.earliest_loan,
    
    -- Account age
    GREATEST(
      EXTRACT(YEAR FROM AGE(NOW(), borrowed.earliest_loan)) * 12 + 
      EXTRACT(MONTH FROM AGE(NOW(), borrowed.earliest_loan)),
      0
    )::INTEGER AS account_age_months
    
  FROM (
    -- Borrowed loans statistics
    SELECT 
      COUNT(*)::INTEGER as total_loans,
      COUNT(CASE WHEN status = 'repaid' THEN 1 END)::INTEGER as loans_repaid,
      COUNT(CASE WHEN status = 'defaulted' THEN 1 END)::INTEGER as loans_defaulted,
      COALESCE(SUM(CASE WHEN status = 'repaid' THEN repay_usdc END), 0) as total_borrowed,
      
      -- Calculate current repayment streak
      COALESCE((
        SELECT COUNT(*)::INTEGER
        FROM (
          SELECT status,
                 ROW_NUMBER() OVER (ORDER BY due_ts DESC) as rn
          FROM loans 
          WHERE borrower_fid = p_user_fid 
            AND status IN ('repaid', 'defaulted')
          ORDER BY due_ts DESC
        ) streak_calc
        WHERE rn <= (
          SELECT COALESCE(MIN(rn) - 1, COUNT(*))
          FROM (
            SELECT status,
                   ROW_NUMBER() OVER (ORDER BY due_ts DESC) as rn
            FROM loans 
            WHERE borrower_fid = p_user_fid 
              AND status IN ('repaid', 'defaulted')
            ORDER BY due_ts DESC
          ) s
          WHERE status != 'repaid'
        )
        AND status = 'repaid'
      ), 0) as repayment_streak,
      
      -- Average repayment days (negative = early, positive = late)
      AVG(
        CASE 
          WHEN status = 'repaid' AND repaid_at IS NOT NULL THEN
            EXTRACT(DAY FROM (repaid_at::timestamp - due_ts::timestamp))
          ELSE NULL 
        END
      ) as avg_repayment_days,
      
      MIN(created_at) as earliest_loan
      
    FROM loans 
    WHERE borrower_fid = p_user_fid
  ) borrowed
  
  FULL OUTER JOIN (
    -- Lent loans statistics  
    SELECT 
      COALESCE(COUNT(*), 0)::NUMERIC as total_lent
    FROM loans 
    WHERE lender_fid = p_user_fid
  ) lent ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to update user reputation cache
CREATE OR REPLACE FUNCTION update_user_reputation(p_user_fid BIGINT)
RETURNS VOID AS $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Get user stats
  SELECT * INTO stats_record 
  FROM get_user_loan_stats(p_user_fid);
  
  -- Update or insert reputation cache
  INSERT INTO user_reputation_cache (
    user_fid,
    credit_score,
    total_loans,
    loans_repaid,
    loans_defaulted,
    total_borrowed,
    total_lent,
    repayment_streak,
    avg_repayment_days,
    updated_at
  ) VALUES (
    p_user_fid,
    -- Simple credit score calculation (will be enhanced by application)
    GREATEST(0, LEAST(1000, 
      500 + 
      (CASE WHEN stats_record.total_loans > 0 
        THEN (stats_record.loans_repaid::FLOAT / stats_record.total_loans * 200)
        ELSE 0 END) +
      (stats_record.repayment_streak * 10) -
      (stats_record.loans_defaulted * 100)
    ))::INTEGER,
    stats_record.total_loans,
    stats_record.loans_repaid,
    stats_record.loans_defaulted,
    stats_record.total_borrowed,
    stats_record.total_lent,
    stats_record.repayment_streak,
    stats_record.avg_repayment_days,
    NOW()
  )
  ON CONFLICT (user_fid) DO UPDATE SET
    credit_score = EXCLUDED.credit_score,
    total_loans = EXCLUDED.total_loans,
    loans_repaid = EXCLUDED.loans_repaid,
    loans_defaulted = EXCLUDED.loans_defaulted,
    total_borrowed = EXCLUDED.total_borrowed,
    total_lent = EXCLUDED.total_lent,
    repayment_streak = EXCLUDED.repayment_streak,
    avg_repayment_days = EXCLUDED.avg_repayment_days,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Reputation cache table for performance
CREATE TABLE IF NOT EXISTS user_reputation_cache (
  user_fid BIGINT PRIMARY KEY,
  credit_score INTEGER NOT NULL DEFAULT 500,
  total_loans INTEGER NOT NULL DEFAULT 0,
  loans_repaid INTEGER NOT NULL DEFAULT 0,
  loans_defaulted INTEGER NOT NULL DEFAULT 0,
  total_borrowed NUMERIC DEFAULT 0,
  total_lent NUMERIC DEFAULT 0,
  repayment_streak INTEGER NOT NULL DEFAULT 0,
  avg_repayment_days NUMERIC,
  reputation_tier TEXT DEFAULT 'newcomer',
  trust_score INTEGER DEFAULT 50,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_reputation_cache_credit_score ON user_reputation_cache(credit_score DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_cache_tier ON user_reputation_cache(reputation_tier);
CREATE INDEX IF NOT EXISTS idx_reputation_cache_updated ON user_reputation_cache(updated_at DESC);