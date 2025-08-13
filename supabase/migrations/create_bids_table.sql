-- Create bids table to track all auction activity
-- This captures the full bidding history for market analysis

CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    bidder_fid BIGINT NOT NULL,
    bid_amount NUMERIC(18,2) NOT NULL,
    bid_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    bid_sequence INTEGER, -- Order of this bid (1st, 2nd, 3rd, etc.)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'winning', 'losing')),
    cast_hash TEXT, -- If bid was made via Farcaster cast
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bids_loan_id ON bids(loan_id);
CREATE INDEX idx_bids_bidder_fid ON bids(bidder_fid);
CREATE INDEX idx_bids_amount ON bids(bid_amount DESC);
CREATE INDEX idx_bids_timestamp ON bids(bid_timestamp DESC);

-- Create a unique constraint to prevent duplicate bids from same user on same loan
-- (unless they're updating their bid)
CREATE UNIQUE INDEX idx_bids_unique_active ON bids(loan_id, bidder_fid) 
WHERE status = 'active';

-- Add comments for clarity
COMMENT ON TABLE bids IS 'Tracks all bids placed on loans for market analysis';
COMMENT ON COLUMN bids.bid_sequence IS 'Order of bid placement (1=first bid, 2=second, etc.)';
COMMENT ON COLUMN bids.status IS 'active=current bid, winning=won auction, losing=lost auction, withdrawn=user cancelled';

-- Function to automatically update bid sequence
CREATE OR REPLACE FUNCTION set_bid_sequence()
RETURNS TRIGGER AS $$
BEGIN
    -- Set sequence number based on existing bids for this loan
    SELECT COALESCE(MAX(bid_sequence), 0) + 1 
    INTO NEW.bid_sequence 
    FROM bids 
    WHERE loan_id = NEW.loan_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set bid sequence
CREATE TRIGGER trigger_set_bid_sequence
    BEFORE INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION set_bid_sequence();

-- Function to update bid statuses when loan is funded
CREATE OR REPLACE FUNCTION update_bid_statuses_on_funding()
RETURNS TRIGGER AS $$
BEGIN
    -- When a loan status changes to 'funded', update all bid statuses
    IF NEW.status = 'funded' AND OLD.status != 'funded' THEN
        -- Mark the winning bid
        UPDATE bids 
        SET status = 'winning', updated_at = NOW()
        WHERE loan_id = NEW.id 
        AND bidder_fid = NEW.lender_fid 
        AND bid_amount = NEW.gross_usdc
        AND status = 'active';
        
        -- Mark all other bids as losing
        UPDATE bids 
        SET status = 'losing', updated_at = NOW()
        WHERE loan_id = NEW.id 
        AND NOT (bidder_fid = NEW.lender_fid AND bid_amount = NEW.gross_usdc)
        AND status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update bid statuses when loan is funded
CREATE TRIGGER trigger_update_bid_statuses
    AFTER UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_bid_statuses_on_funding();