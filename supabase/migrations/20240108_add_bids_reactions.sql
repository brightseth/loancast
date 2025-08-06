-- Create bids table to track loan bids from Farcaster replies
CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  lender_fid INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  cast_hash TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reactions table to track engagement
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  user_fid INTEGER NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'recast')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(loan_id, user_fid, reaction_type)
);

-- Add engagement columns to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recasts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS funded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bids_loan_id ON bids(loan_id);
CREATE INDEX IF NOT EXISTS idx_bids_lender_fid ON bids(lender_fid);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_reactions_loan_id ON reactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_fid ON reactions(user_fid);

-- Functions to increment engagement counters
CREATE OR REPLACE FUNCTION increment_likes_count(loan_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE loans 
  SET likes_count = likes_count + 1 
  WHERE id = loan_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_recasts_count(loan_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE loans 
  SET recasts_count = recasts_count + 1 
  WHERE id = loan_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get highest bid for a loan
CREATE OR REPLACE FUNCTION get_highest_bid(loan_id UUID)
RETURNS TABLE (
  bid_id UUID,
  lender_fid INTEGER,
  amount DECIMAL(10, 2),
  cast_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, lender_fid, amount, cast_hash, created_at
  FROM bids
  WHERE loan_id = $1 AND status = 'active'
  ORDER BY amount DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;