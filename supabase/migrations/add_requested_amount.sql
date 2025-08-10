-- Add requested_usdc field to track original loan request amount
-- This allows us to track requested vs funded amounts after auction settlement

ALTER TABLE loans ADD COLUMN requested_usdc NUMERIC(18,2);

-- Add comment explaining the field
COMMENT ON COLUMN loans.requested_usdc IS 'Original amount requested by borrower before auction/negotiation';

-- Update existing loans to set requested_usdc = gross_usdc for historical data
-- This assumes gross_usdc currently represents the original request amount
UPDATE loans SET requested_usdc = gross_usdc WHERE requested_usdc IS NULL;

-- For future clarity, let's add comments to existing fields
COMMENT ON COLUMN loans.gross_usdc IS 'Actual amount funded/settled after auction';
COMMENT ON COLUMN loans.net_usdc IS 'Net amount received by borrower after fees';
COMMENT ON COLUMN loans.repay_usdc IS 'Total amount to be repaid (principal + interest)';

-- Create index for performance on common queries
CREATE INDEX idx_loans_requested_funded ON loans(requested_usdc, gross_usdc) WHERE status IN ('funded', 'repaid');