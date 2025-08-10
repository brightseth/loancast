-- Add description column to loans table for loan purpose/notes
ALTER TABLE loans ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN loans.description IS 'Optional description of what the loan is for (like Venmo notes)';

-- Success message
SELECT 'Description column added successfully!' as status;