-- Create a counter table for sequential loan numbering
CREATE TABLE IF NOT EXISTS loan_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  next_loan_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the initial counter if it doesn't exist
INSERT INTO loan_counter (id, next_loan_number) 
VALUES (1, 1) 
ON CONFLICT (id) DO NOTHING;

-- Create a function to get and increment the next loan number atomically
CREATE OR REPLACE FUNCTION get_next_loan_number() 
RETURNS INTEGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    UPDATE loan_counter 
    SET next_loan_number = next_loan_number + 1,
        updated_at = NOW()
    WHERE id = 1
    RETURNING next_loan_number - 1 INTO next_num;
    
    RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Add loan_number column to existing loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_number INTEGER;

-- Create unique index on loan_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_loan_number ON loans(loan_number);