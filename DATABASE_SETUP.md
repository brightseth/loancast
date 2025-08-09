# Database Setup for LoanCast

## Quick Setup (Run this SQL in Supabase)

```sql
-- Create rate_limits table (prevents spam)
CREATE TABLE IF NOT EXISTS rate_limits (
  identifier text NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 1,
  PRIMARY KEY (identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS rl_window_idx ON rate_limits (window_start);
```

## Current Database Schema

The app expects these columns in the `loans` table:
- `id` (uuid)
- `loan_number` (int, nullable)
- `cast_hash` (text)
- `borrower_fid` (int)
- `lender_fid` (int, nullable)
- `gross_usdc` (numeric) - loan amount
- `net_usdc` (numeric) - amount after fees
- `yield_bps` (int) - interest rate in basis points
- `repay_usdc` (numeric) - repayment amount
- `start_ts` (timestamp)
- `due_ts` (timestamp)
- `status` (text) - 'open', 'funded', 'repaid', 'default', 'deleted'
- `tx_fund` (text, nullable) - funding transaction hash
- `tx_repay` (text, nullable) - repayment transaction hash
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Testing the App

1. **Create the rate_limits table** using the SQL above
2. **Deploy to Vercel** - changes will auto-deploy from main branch
3. **Test loan creation** at `/loans/new`
4. **View loans** at `/explore`
5. **Check lending dashboard** at `/dashboard/lending`

## Known Issues (MVP)

- Rate limiting is currently bypassed if table doesn't exist (fail-open for MVP)
- No RLS policies yet (add when handling real money)
- Admin routes not protected (add auth when needed)