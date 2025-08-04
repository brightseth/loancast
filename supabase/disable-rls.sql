-- Temporarily disable RLS for development
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE repayments DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Or create more permissive policies
DROP POLICY IF EXISTS "Public can read all loans" ON loans;
DROP POLICY IF EXISTS "Borrowers can insert their own loans" ON loans;
DROP POLICY IF EXISTS "Borrowers can update their own loans" ON loans;

CREATE POLICY "Allow all operations on loans" ON loans
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read all repayments" ON repayments;
DROP POLICY IF EXISTS "Borrowers can insert repayments for their loans" ON repayments;

CREATE POLICY "Allow all operations on repayments" ON repayments
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true) WITH CHECK (true);