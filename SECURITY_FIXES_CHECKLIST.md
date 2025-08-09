# 🔒 Security Fixes Implementation Checklist

Based on comprehensive code review feedback. **Complete these items before handling real money.**

## 🚨 Critical Security Fixes (Do First)

### **Payment Security**
- [ ] **Run database migration**: `security_integrity_improvements.sql`
- [ ] **Run repayment functions**: `repayment_functions.sql` 
- [ ] **Test repayment flow**: Use `/api/repay/[id]/init` → `/api/repay/[id]/confirm`
- [ ] **Verify replay protection**: Try submitting same tx_hash twice (should fail)
- [ ] **Test amount validation**: Send insufficient payment (should reject)
- [ ] **Test address validation**: Send from wrong wallet (should reject)

### **Database Integrity**
- [ ] **Enable RLS**: All tables should have Row Level Security enabled
- [ ] **Test status transitions**: Only valid state changes should be allowed
- [ ] **Test notification deduplication**: Same reminder shouldn't send twice
- [ ] **Test audit trails**: All state changes should be logged

### **Rate Limiting**
- [ ] **Install rate limiting**: Add to critical API endpoints
- [ ] **Test limits**: Make rapid requests (should get 429 responses)
- [ ] **Test cleanup**: Old rate limit entries should expire

### **Webhook Security**
- [ ] **Verify signature validation**: Neynar webhooks must have valid signatures
- [ ] **Test CRON protection**: Endpoints should require CRON_SECRET
- [ ] **Add IP allowlisting**: Restrict cron access to Vercel IPs if possible

## 🔧 Implementation Steps

### **Step 1: Database Updates**
```bash
# Run in Supabase SQL editor or via CLI
psql $DATABASE_URL -f supabase/migrations/security_integrity_improvements.sql
psql $DATABASE_URL -f supabase/migrations/repayment_functions.sql
```

### **Step 2: Update Dependencies**
```bash
npm install zod  # For schema validation
npm install @supabase/supabase-js@latest  # Latest version
```

### **Step 3: Environment Variables**
```bash
# Add to .env.local and Vercel
CRON_SECRET=your-random-secret-256-bits
BASE_RPC_URL=https://mainnet.base.org
USDC_CONTRACT_ADDRESS=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
```

### **Step 4: Update Existing APIs**
- [ ] Replace `number` with `bigint` for all USDC amounts
- [ ] Add Zod validation to all API routes
- [ ] Wrap loan status changes with `transition_loan_status()` function
- [ ] Add rate limiting to loan creation and repayment endpoints

### **Step 5: Testing Protocol**
1. **Unit Tests**: Create test cases for bigint math
2. **Integration Tests**: Test full repayment flow
3. **Security Tests**: Try replay attacks, wrong amounts, etc.
4. **Load Tests**: Test rate limiting under high load

## 🧪 Acceptance Tests

### **Payment Flow**
- [ ] Create loan → Fund → Initiate repayment → Confirm payment
- [ ] Try double-spending same tx_hash (should fail)
- [ ] Try insufficient payment (should fail)  
- [ ] Try payment from wrong address (should fail)
- [ ] Verify exact amount calculation (principal * 1.02)

### **Status Transitions**
- [ ] seeking → funded → due → repaid (valid)
- [ ] seeking → repaid (invalid, should fail)
- [ ] funded → seeking (invalid, should fail)

### **Rate Limiting**
- [ ] Make 11 requests to /api/loans in 1 minute (11th should fail)
- [ ] Wait 1 minute, try again (should work)
- [ ] Test different endpoints have different limits

### **Data Integrity**
- [ ] All status changes logged in loan_status_transitions
- [ ] All repayments logged with full transaction details
- [ ] Reputation events created for successful repayments
- [ ] Notifications properly deduplicated

## ⚡ Performance Checks

### **Database**
- [ ] All tables have proper indexes
- [ ] Status transition queries are fast (<100ms)
- [ ] Rate limiting queries are fast (<50ms)
- [ ] RLS policies don't cause full table scans

### **API Response Times**
- [ ] Loan creation: <500ms
- [ ] Repayment init: <300ms  
- [ ] Repayment confirm: <1s (includes on-chain verification)
- [ ] Status updates: <200ms

## 🔍 Code Quality

### **TypeScript**
- [ ] No `any` types in payment flows
- [ ] All money amounts use `bigint`
- [ ] Proper error types and handling
- [ ] Zod schemas for all API inputs

### **Error Handling**
- [ ] All errors logged to Sentry with context
- [ ] User-friendly error messages
- [ ] No sensitive data in error responses
- [ ] Proper HTTP status codes

## 🚀 Deployment Checklist

### **Pre-Deploy**
- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables updated
- [ ] Rate limiting tested

### **Deploy Process**
1. Deploy to staging first
2. Run full test suite
3. Test with real (small) transactions
4. Monitor error rates for 24h
5. Deploy to production

### **Post-Deploy Monitoring**
- [ ] Error rates normal (<0.1%)
- [ ] Response times acceptable
- [ ] No failed transactions
- [ ] Rate limiting working correctly

## 🎯 Success Criteria

**Security**: ✅ All payment spoofing vectors closed  
**Reliability**: ✅ No double-spending or replay attacks possible  
**Performance**: ✅ All APIs respond under target times  
**Monitoring**: ✅ Full audit trail of all state changes  

---

## 🆘 If Something Goes Wrong

### **Payment Issues**
1. Check transaction hash on Base explorer
2. Verify USDC contract logs
3. Check loan_status_transitions table
4. Look for duplicate tx_hash in repayments

### **Database Issues**  
1. Check RLS policies aren't blocking legitimate access
2. Verify status transition function isn't deadlocking
3. Monitor slow query log

### **Rate Limit Issues**
1. Check rate_limits table for bloat
2. Verify cleanup cron is running
3. Adjust limits if legitimate usage pattern

---

**⚠️ DO NOT handle real money until ALL items are checked off!**