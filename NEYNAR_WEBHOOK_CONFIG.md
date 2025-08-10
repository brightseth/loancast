# Neynar Webhook Configuration

## Current Configuration
- **Webhook URL**: `https://loancast.app/api/webhooks/neynar`
- **Webhook Secret**: `lyv0ByQAl1QM2MhY9vvLZ1ErJ`
- **Status**: ✅ Endpoint working and processing events correctly

## Required Event Types

To enable automatic cast deletion sync, configure these events in your Neynar dashboard:

### 1. cast.created ✅ (likely already enabled)
- Used for detecting replies/bids on loan casts
- Currently processing correctly

### 2. cast.deleted 🔍 (needs verification)
- **Critical for loan deletion sync**
- When users delete their loan casts, this event should trigger loan removal
- Current status: Working when manually triggered, needs auto-config

### 3. reaction.created ✅ (optional)
- Used for analytics and engagement tracking
- Currently processing correctly

## Configuration Steps

1. **Login to Neynar Dashboard**
   - Go to: https://dev.neynar.com/
   - Navigate to your project/webhook settings

2. **Verify Webhook Endpoint**
   - URL: `https://loancast.app/api/webhooks/neynar`
   - Secret: `lyv0ByQAl1QM2MhY9vvLZ1ErJ`
   - Method: POST

3. **Enable Required Events**
   - ✅ `cast.created` 
   - ❗ `cast.deleted` (enable this one!)
   - ✅ `reaction.created` (optional)

4. **Test Configuration**
   - Create a test cast
   - Delete the test cast  
   - Verify webhook receives both events

## Verification Commands

After configuration, test with:

```bash
# Create a small test loan
# Delete the cast on Farcaster
# Check if loan disappears from API
curl "https://loancast.app/api/loans" | jq length
```

## Current Status: ✅ READY

- ✅ Webhook endpoint working
- ✅ Signature verification working  
- ✅ Database column exists
- ✅ API filtering logic deployed
- ❗ Neynar cast.deleted events need configuration

**Next**: Enable cast.deleted events in Neynar dashboard