-- Create rate_limits table (minimal version for MVP)
CREATE TABLE IF NOT EXISTS rate_limits (
  identifier text NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 1,
  PRIMARY KEY (identifier, endpoint, window_start)
);

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS rl_window_idx ON rate_limits (window_start);

-- Optional: Clean up old entries periodically
-- DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';