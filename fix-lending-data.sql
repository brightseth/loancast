-- Fix incorrect FIDs for Seth (5042) and Henry (732) loans
-- Henry's $100 loan: Henry borrowed, Seth funded
-- Seth's $789 loan: Seth borrowed, Henry funded

-- Fix Henry's loan: Seth (5042) funded Henry's (732) $100 loan
UPDATE loans 
SET lender_fid = 5042,
    updated_at = NOW(),
    notes = COALESCE(notes, '') || ' | Fixed: Seth (5042) funded Henry (732) loan by collecting cast'
WHERE id = '9abed685-639c-44ce-b811-c83e897d94dd'
  AND cast_hash = '0xbde513732ef90778b27f69935fbd9207323431a0'
  AND borrower_fid = 732; -- Henry

-- Fix Seth's loan: Seth (5042) borrowed $789, Henry (732) funded it
UPDATE loans 
SET borrower_fid = 5042,
    lender_fid = 732,
    updated_at = NOW(), 
    notes = COALESCE(notes, '') || ' | Fixed: Seth (5042) borrowed, Henry (732) funded'
WHERE id = 'b6c98b1d-f440-4829-8d35-cdbffad43545'
  AND gross_usdc = 789;

-- Verify the updates
SELECT id, cast_hash, borrower_fid, lender_fid, gross_usdc, repay_usdc, status, notes
FROM loans 
WHERE lender_fid = 5042 OR borrower_fid = 5042
ORDER BY created_at DESC;