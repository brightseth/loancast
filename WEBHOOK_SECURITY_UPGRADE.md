# Webhook Security Upgrade Guide

This upgrade implements production-ready webhook handling based on security feedback. The changes address critical issues that would cause problems at launch.

## 🚨 Critical Changes

### **BREAKING**: Auto-funding from replies removed
- **OLD**: Reply with "$100" → loan automatically marked as funded
- **NEW**: Replies stored as `bid_proposals` for discovery only
- **Impact**: You must implement proper funding flow via collect/auction events or on-chain USDC transfers

### **SECURE**: Manual sync endpoint now requires auth
- **OLD**: GET `/api/webhooks/neynar?loan_id=xyz` (public)
- **NEW**: GET `/api/webhooks/neynar-secure` with `Authorization: Bearer <WEBHOOK_OPERATOR_SECRET>`
- **Impact**: Add `WEBHOOK_OPERATOR_SECRET` to environment variables

## 🛠 Deployment Steps

### 1. Run Database Migration
```bash
# Run the new migration
supabase db push --include-all

# Or manually apply:
psql $DATABASE_URL -f supabase/migrations/002_webhook_improvements.sql
```

### 2. Update Environment Variables
Add to production environment:
```bash
WEBHOOK_OPERATOR_SECRET="secure-random-key-for-manual-sync-access"
```

### 3. Update Webhook URL in Neynar
**Option A**: Replace existing webhook
- Old: `https://loancast.app/api/webhooks/neynar`
- New: `https://loancast.app/api/webhooks/neynar-secure`

**Option B**: Run both temporarily (recommended)
- Keep old webhook for existing events
- Add new webhook for future events
- Monitor both for a few days, then remove old

### 4. Update Manual Sync Calls
Any scripts or admin tools calling manual sync must include auth:
```bash
# OLD (will return 404)
curl "https://loancast.app/api/webhooks/neynar?loan_id=123"

# NEW 
curl -H "Authorization: Bearer $WEBHOOK_OPERATOR_SECRET" \
  "https://loancast.app/api/webhooks/neynar-secure?loan_id=123"
```

## 📊 New Database Tables

### `webhook_inbox` - Idempotency & Event Ordering
- Prevents duplicate processing
- Handles webhook retries safely
- 7-day retention of processed events

### `loan_events` - Complete Audit Trail  
- Records all loan state changes
- Includes webhook event IDs for traceability
- Permanent retention

### `bid_proposals` - Discovery Only
- Stores parsed amounts from replies
- **NOT used for funding decisions**
- Helps UX show interest/bids

### `webhook_rate_limits` - Abuse Prevention
- Per-FID rate limiting (30 events/min)
- Automatic cleanup of old data
- Blocks spam patterns

## 🔒 Security Improvements

### ✅ HMAC + Timestamp Validation
- Verifies webhook signatures with timing-safe comparison
- Rejects events >5 minutes old (prevents replay attacks)
- Logs all verification failures

### ✅ Rate Limiting & Abuse Detection
- 30 webhooks per minute per FID
- Detects spam patterns (same FID posting many $ amounts)
- Blocks obvious abuse automatically

### ✅ Idempotency Guarantees
- Each `event_id` processed exactly once
- Handles webhook retries gracefully
- Prevents duplicate state changes

### ✅ Secured Manual Sync
- Requires `WEBHOOK_OPERATOR_SECRET` bearer token
- IP logging for audit trail
- Returns 404 for unauthorized access (hides endpoint)

## 🏗 Architecture Changes

### Webhook Processing Flow
1. **Verify HMAC** signature + timestamp window
2. **Check idempotency** in `webhook_inbox` 
3. **Apply rate limits** per FID/event type
4. **Process event** safely (no auto-funding)
5. **Record audit trail** in `loan_events`
6. **Mark processed** to prevent retries

### Bid Proposal Flow (Discovery Only)
1. Parse reply text for amounts (`$100`, `50 USDC`)
2. Store in `bid_proposals` table
3. **DO NOT change loan status**
4. Use for UX to show interest/activity

### Funding Flow (TODO - Implement)
You must implement proper funding via:
- **Collect/auction settle events** (preferred)
- **On-chain USDC transfer verification** (fallback)
- **Manual admin approval** (temporary)

## 🧪 Testing Checklist

### Idempotency Tests
- [ ] Duplicate webhook → processed once
- [ ] Retry after failure → resumes correctly
- [ ] Out-of-order events → handled safely

### Security Tests  
- [ ] Invalid HMAC signature → 401
- [ ] Expired timestamp → 401  
- [ ] Rate limit exceeded → 429
- [ ] Manual sync without auth → 404

### Abuse Prevention
- [ ] Same FID spamming → blocked
- [ ] Malformed bids → ignored safely
- [ ] Non-USDC amounts → parsed as null

### State Safety
- [ ] Reply with "$100" → no auto-funding
- [ ] Cast deletion → proper cleanup
- [ ] Analytics failure → non-blocking

## 📈 Monitoring

### Key Metrics to Watch
- `webhook_inbox` processing latency
- Rate limit violations per hour
- Failed HMAC verifications  
- Manual sync usage frequency

### Alerts to Set Up
- Webhook processing failures >5%
- Rate limit violations >100/hour
- HMAC failures >10/hour
- Manual sync abuse patterns

## 🔄 Rollback Plan

If issues occur:
1. **Revert webhook URL** in Neynar to old endpoint
2. **Keep new database tables** (they're additive)
3. **Monitor old endpoint** for stability
4. **Debug new endpoint** offline

The old webhook handler remains available for emergency fallback.

## 📝 Next Steps

After deployment:
1. **Implement proper funding flow** (collect events or on-chain)
2. **Add background queue** for analytics processing
3. **Set up monitoring** dashboards for webhook health
4. **Review audit logs** regularly for suspicious activity
5. **Load test** webhook endpoint under realistic traffic

## ❓ FAQ

**Q: Will this break existing loans?**
A: No, existing loans are unaffected. Only new webhook processing changes.

**Q: What happens to pending bid replies?** 
A: They'll be stored as proposals but won't auto-fund. You'll need to implement proper funding.

**Q: Can I run both webhook endpoints?**
A: Yes, recommended for gradual migration. Both can coexist safely.

**Q: How do I migrate Neynar webhook settings?**
A: Update webhook URL in your Neynar dashboard from `/neynar` to `/neynar-secure`.