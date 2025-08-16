-- Fix column name mismatches in functions

-- Update the sum_agent_spend_last24h function to use correct column name
CREATE OR REPLACE FUNCTION sum_agent_spend_last24h(p_agent_fid BIGINT)
RETURNS TABLE(sum BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(l.gross_usdc::BIGINT), 0)::BIGINT
  FROM funding_intents fi
  JOIN loans l ON l.id = fi.loan_id
  WHERE fi.lender_fid = p_agent_fid
    AND fi.lender_type = 'agent'
    AND fi.created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Verify the fix
SELECT sum_agent_spend_last24h(999001);