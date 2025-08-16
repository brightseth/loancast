-- Create agent_stats table for performance tracking
CREATE TABLE IF NOT EXISTS agent_stats (
  agent_fid BIGINT PRIMARY KEY,
  loans_funded INT DEFAULT 0,
  total_funded_usdc_6 BIGINT DEFAULT 0,
  loans_repaid INT DEFAULT 0,
  loans_defaulted INT DEFAULT 0,
  default_rate_bps INT DEFAULT 0,
  avg_yield_bps INT DEFAULT 0,
  score INT DEFAULT 500,  -- Start at middle score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Create or update stats when agent is created
CREATE OR REPLACE FUNCTION create_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO agent_stats (agent_fid)
  VALUES (NEW.agent_fid)
  ON CONFLICT (agent_fid) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create stats when agent is registered
CREATE TRIGGER create_agent_stats_trigger
AFTER INSERT ON agents
FOR EACH ROW
EXECUTE FUNCTION create_agent_stats();

-- Update stats when funding intent is created
CREATE OR REPLACE FUNCTION update_agent_stats_on_funding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lender_type = 'agent' THEN
    UPDATE agent_stats 
    SET 
      loans_funded = loans_funded + 1,
      last_active = NOW()
    WHERE agent_fid = NEW.lender_fid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for funding intents
CREATE TRIGGER update_agent_stats_on_funding_trigger
AFTER INSERT ON funding_intents
FOR EACH ROW
EXECUTE FUNCTION update_agent_stats_on_funding();

-- Create stats for existing agents
INSERT INTO agent_stats (agent_fid)
SELECT agent_fid FROM agents
ON CONFLICT (agent_fid) DO NOTHING;

-- Grant access
GRANT SELECT ON agent_stats TO anon;
GRANT ALL ON agent_stats TO service_role;