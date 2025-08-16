# 🚀 Database Migration Guide for Agent Lending

## Prerequisites
- Access to your Supabase project dashboard
- Database permissions (service_role)

## Step-by-Step Instructions

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your LoanCast project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Copy Migration SQL**
   - Copy the entire contents of `/supabase/migrations/20250816_complete_agent_system.sql`
   - Paste into the SQL editor

4. **Run Migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message

5. **Verify Migration**
   Run these verification queries:
   ```sql
   -- Check if columns were added
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'loans' 
   AND column_name IN ('borrower_type', 'lender_type');

   -- Check if agent tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('agents', 'agent_stats', 'funding_intents');

   -- Count agents (should be at least the test ones)
   SELECT COUNT(*) as agent_count FROM agents;
   ```

### Option 2: Via Supabase CLI

1. **Install Supabase CLI** (if not installed)
   ```bash
   npm install -g supabase
   ```

2. **Link to your project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Run migration**
   ```bash
   supabase db push
   ```

### Option 3: Direct Connection

1. **Get connection string**
   - Supabase Dashboard → Settings → Database
   - Copy "Connection string"

2. **Run with psql**
   ```bash
   psql "YOUR_CONNECTION_STRING" -f supabase/migrations/20250816_complete_agent_system.sql
   ```

## Post-Migration Testing

### 1. Test Agent Registration
```bash
curl -X POST https://loancast.app/api/agents/auth \
  -H "Content-Type: application/json" \
  -d '{
    "agent_fid": 555001,
    "controller_fid": 12345,
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd1",
    "agent_type": "lp",
    "strategy": {
      "riskTolerance": "moderate",
      "maxLoanAmount": 100,
      "minCreditScore": 0
    },
    "policy": {
      "daily_usdc_cap": 1000,
      "allow_autofund": true
    }
  }'
```

Expected: Returns `{"session_token": "..."}`

### 2. Check Agent Performance
```bash
curl https://loancast.app/api/agents/555001/performance
```

Expected: Returns agent stats JSON

### 3. Check Available Loans
```bash
curl "https://loancast.app/api/loans/available?minScore=0"
```

Expected: Returns array of available loans with `borrower_type` field

### 4. Verify in UI
- Go to https://loancast.app/explore
- Look for borrower type indicators (🤖 for agents, 👤 for humans)
- Try the "Auto" button to test auto-funding

## Troubleshooting

### If migration fails:

1. **"relation already exists"**
   - This is OK! The migration is idempotent
   - Tables that exist will be skipped

2. **"permission denied"**
   - Make sure you're using service_role key
   - Check database permissions in Supabase

3. **"column already exists"**
   - Safe to ignore, migration handles this

### Rollback (if needed):
```sql
-- Remove agent-related columns
ALTER TABLE loans 
  DROP COLUMN IF EXISTS borrower_type,
  DROP COLUMN IF EXISTS lender_type;

-- Drop agent tables
DROP TABLE IF EXISTS funding_intents CASCADE;
DROP TABLE IF EXISTS human_autolend_prefs CASCADE;
DROP TABLE IF EXISTS agent_loans CASCADE;
DROP TABLE IF EXISTS agent_limits CASCADE;
DROP TABLE IF EXISTS agent_sessions CASCADE;
DROP TABLE IF EXISTS agent_stats CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
```

## Success Indicators

✅ All verification queries return data
✅ Agent registration API returns session tokens
✅ Available loans API includes type fields
✅ UI shows borrower/lender type badges
✅ Auto-fund button appears in Explore

## Next Steps

After successful migration:
1. Test all four quadrants (Human↔Human, Human↔Agent, Agent↔Human, Agent↔Agent)
2. Monitor `funding_intents` table for activity
3. Check agent performance at `/api/agents/{fid}/performance`
4. Review logs for any errors

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs → Postgres)
2. Review error messages in browser console
3. Test with simplified curl commands first
4. Verify environment variables are set correctly

---

**Migration typically takes < 30 seconds to complete**