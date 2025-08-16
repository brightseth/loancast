-- Complete Agent System Migration (PostgreSQL Compatible)
-- Run this in Supabase SQL Editor to enable agent lending

-- ============================================
-- PART 1: Core Agent Tables
-- ============================================

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  agent_fid BIGINT PRIMARY KEY,
  controller_fid BIGINT NOT NULL,
  wallet TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('yield', 'arb', 'lp', 'reputation', 'maker')),
  strategy JSONB NOT NULL DEFAULT '{}',
  strategy_hash TEXT,
  policy JSONB NOT NULL DEFAULT '{}',
  verified_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent sessions for authentication
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_fid BIGINT NOT NULL REFERENCES agents(agent_fid) ON DELETE CASCADE,
  session_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes separately (PostgreSQL syntax)
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_fid ON agent_sessions(agent_fid);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_expires ON agent_sessions(expires_at);

-- Agent velocity/limit tracking
CREATE TABLE IF NOT EXISTS agent_limits (
  agent_fid BIGINT PRIMARY KEY REFERENCES agents(agent_fid) ON DELETE CASCADE,
  daily_loans_funded INT DEFAULT 0,
  daily_usdc_funded_6 BIGINT DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent loan tracking
CREATE TABLE IF NOT EXISTS agent_loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL,
  lender_agent_fid BIGINT NOT NULL REFERENCES agents(agent_fid),
  decision TEXT NOT NULL CHECK (decision IN ('funded', 'rejected')),
  reasons JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: Human-Agent Bridge (Loan Types)
-- ============================================

-- Add borrower and lender types to loans
ALTER TABLE loans 
  ADD COLUMN IF NOT EXISTS borrower_type TEXT NOT NULL DEFAULT 'human' 
    CHECK (borrower_type IN ('human', 'agent')),
  ADD COLUMN IF NOT EXISTS lender_type TEXT 
    CHECK (lender_type IN ('human', 'agent'));

-- Human autolend preferences
CREATE TABLE IF NOT EXISTS human_autolend_prefs (
  lender_fid BIGINT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT false,
  min_score INT DEFAULT 600,
  max_amount_usdc DECIMAL(10,2) DEFAULT 100,
  max_duration_days INT DEFAULT 30,
  daily_limit_usdc DECIMAL(10,2) DEFAULT 500,
  per_borrower_limit_usdc DECIMAL(10,2) DEFAULT 100,
  allow_human BOOLEAN NOT NULL DEFAULT true,
  allow_agent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funding intents for provenance tracking
CREATE TABLE IF NOT EXISTS funding_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL,
  lender_fid BIGINT NOT NULL,
  lender_type TEXT NOT NULL CHECK (lender_type IN ('human', 'agent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes separately
CREATE INDEX IF NOT EXISTS idx_funding_intents_loan ON funding_intents(loan_id);
CREATE INDEX IF NOT EXISTS idx_funding_intents_lender ON funding_intents(lender_fid);
CREATE INDEX IF NOT EXISTS idx_funding_intents_created ON funding_intents(created_at);

-- ============================================
-- PART 3: Agent Stats and Performance
-- ============================================

CREATE TABLE IF NOT EXISTS agent_stats (
  agent_fid BIGINT PRIMARY KEY,
  loans_funded INT DEFAULT 0,
  total_funded_usdc_6 BIGINT DEFAULT 0,
  loans_repaid INT DEFAULT 0,
  loans_defaulted INT DEFAULT 0,
  default_rate_bps INT DEFAULT 0,
  avg_yield_bps INT DEFAULT 0,
  score INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 4: Functions and Triggers
-- ============================================

-- Function to reset daily limits
CREATE OR REPLACE FUNCTION reset_agent_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE agent_limits
  SET daily_loans_funded = 0,
      daily_usdc_funded_6 = 0,
      last_reset_at = NOW()
  WHERE last_reset_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to create agent stats when agent is registered
CREATE OR REPLACE FUNCTION create_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO agent_stats (agent_fid)
  VALUES (NEW.agent_fid)
  ON CONFLICT (agent_fid) DO NOTHING;
  
  INSERT INTO agent_limits (agent_fid)
  VALUES (NEW.agent_fid)
  ON CONFLICT (agent_fid) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create stats when agent is registered
DROP TRIGGER IF EXISTS create_agent_stats_trigger ON agents;
CREATE TRIGGER create_agent_stats_trigger
AFTER INSERT ON agents
FOR EACH ROW
EXECUTE FUNCTION create_agent_stats();

-- Function to update agent stats on funding
CREATE OR REPLACE FUNCTION update_agent_stats_on_funding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lender_type = 'agent' THEN
    UPDATE agent_stats 
    SET 
      loans_funded = loans_funded + 1,
      last_active = NOW()
    WHERE agent_fid = NEW.lender_fid;
    
    -- Also update daily limits
    UPDATE agent_limits
    SET
      daily_loans_funded = daily_loans_funded + 1,
      updated_at = NOW()
    WHERE agent_fid = NEW.lender_fid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for funding intents
DROP TRIGGER IF EXISTS update_agent_stats_on_funding_trigger ON funding_intents;
CREATE TRIGGER update_agent_stats_on_funding_trigger
AFTER INSERT ON funding_intents
FOR EACH ROW
EXECUTE FUNCTION update_agent_stats_on_funding();

-- Function to sum agent spend in last 24h (stub for now)
CREATE OR REPLACE FUNCTION sum_agent_spend_last24h(p_agent_fid BIGINT)
RETURNS TABLE(sum BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(l.principal_usdc_6), 0)::BIGINT
  FROM funding_intents fi
  JOIN loans l ON l.id = fi.loan_id
  WHERE fi.lender_fid = p_agent_fid
    AND fi.lender_type = 'agent'
    AND fi.created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: Row Level Security
-- ============================================

-- Enable RLS on agent tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to agents"
  ON agents FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role has full access to agent_sessions"
  ON agent_sessions FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role has full access to agent_limits"
  ON agent_limits FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role has full access to agent_loans"
  ON agent_loans FOR ALL
  TO service_role
  USING (true);

-- Agent stats are public read
CREATE POLICY "Anyone can read agent_stats"
  ON agent_stats FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Service role can modify agent_stats"
  ON agent_stats FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- PART 6: Additional Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_loans_borrower_type ON loans(borrower_type);
CREATE INDEX IF NOT EXISTS idx_loans_lender_type ON loans(lender_type);
CREATE INDEX IF NOT EXISTS idx_loans_seeking ON loans(status) WHERE status = 'seeking';
CREATE INDEX IF NOT EXISTS idx_agent_sessions_hash ON agent_sessions(session_hash);
CREATE INDEX IF NOT EXISTS idx_funding_intents_daily ON funding_intents(lender_fid, created_at);

-- ============================================
-- PART 7: Backfill Existing Data
-- ============================================

-- Create stats for any existing agents
INSERT INTO agent_stats (agent_fid)
SELECT agent_fid FROM agents
ON CONFLICT (agent_fid) DO NOTHING;

INSERT INTO agent_limits (agent_fid)
SELECT agent_fid FROM agents
ON CONFLICT (agent_fid) DO NOTHING;

-- ============================================
-- PART 8: Grant Permissions
-- ============================================

-- Grant permissions to anon role (public access)
GRANT SELECT ON agents TO anon;
GRANT SELECT ON agent_stats TO anon;
GRANT SELECT ON funding_intents TO anon;

-- Grant all permissions to service_role
GRANT ALL ON agents TO service_role;
GRANT ALL ON agent_sessions TO service_role;
GRANT ALL ON agent_limits TO service_role;
GRANT ALL ON agent_loans TO service_role;
GRANT ALL ON agent_stats TO service_role;
GRANT ALL ON human_autolend_prefs TO service_role;
GRANT ALL ON funding_intents TO service_role;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- After running this migration, verify with:
DO $$
BEGIN
  RAISE NOTICE '=== Migration Complete! ===';
  RAISE NOTICE 'Checking tables...';
  
  -- Check if tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
    RAISE NOTICE '✓ agents table exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_stats') THEN
    RAISE NOTICE '✓ agent_stats table exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'funding_intents') THEN
    RAISE NOTICE '✓ funding_intents table exists';
  END IF;
  
  -- Check if columns were added
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'borrower_type') THEN
    RAISE NOTICE '✓ borrower_type column added to loans';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loans' AND column_name = 'lender_type') THEN
    RAISE NOTICE '✓ lender_type column added to loans';
  END IF;
  
  RAISE NOTICE '=== Agent lending system is now enabled! ===';
END $$;

-- Manual verification queries you can run:
-- SELECT COUNT(*) as agent_count FROM agents;
-- SELECT COUNT(*) as stats_count FROM agent_stats;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'loans' AND column_name IN ('borrower_type', 'lender_type');