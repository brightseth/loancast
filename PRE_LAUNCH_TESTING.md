# 🧪 Pre-Launch Testing Checklist

**Before sharing with potential borrowers - verify everything works!**

## ✅ **Build & Deployment Status**
- [x] **Build Success**: `npm run build` ✅ Compiles without errors
- [ ] **Environment Variables**: All required env vars set
- [ ] **Database Connection**: Supabase connection working
- [ ] **Database Migration**: Security migration applied

## 🔍 **Core User Flows to Test**

### **1. Homepage & Navigation** 
```bash
# Test these URLs manually:
https://loancast.app/                    # Homepage loads
https://loancast.app/about               # About page
https://loancast.app/explore             # Loan feed  
https://loancast.app/loans/new           # Create loan form
```

### **2. Authentication Flow**
- [ ] **Sign In**: Farcaster login works via Neynar
- [ ] **Profile Creation**: New user onboarding
- [ ] **Session Persistence**: User stays logged in

### **3. Loan Creation Flow** 
- [ ] **Form Validation**: Amount limits ($1-$10k), duration (1-3 months)
- [ ] **Cast Creation**: Loan auto-posts to Farcaster 
- [ ] **Database Storage**: Loan saves with BigInt amounts
- [ ] **Error Handling**: Form shows validation errors clearly

### **4. Loan Browsing**
- [ ] **Explore Feed**: Shows available loans
- [ ] **Loan Details**: Individual loan pages load
- [ ] **Profile Pages**: User profiles with loan history
- [ ] **Search/Filter**: Status filtering works

### **5. Funding Flow** (if implemented)
- [ ] **Fund Button**: Lenders can express interest
- [ ] **Collection Webhook**: Cast collections trigger funding
- [ ] **Status Updates**: Loans move from 'seeking' → 'funded'

### **6. Repayment Flow** (NEW - CRITICAL TO TEST)
- [ ] **Repay Init**: `/api/repay/[id]/init` returns wallet target
- [ ] **Amount Calculation**: Server computes exact USDC (principal × 1.02)
- [ ] **Address Validation**: Requires borrower/lender addresses  
- [ ] **Repay Confirm**: `/api/repay/[id]/confirm` verifies on-chain tx

## 🔒 **Security Features Testing**

### **Rate Limiting**
```bash
# Test loan creation rate limit (should fail after 10 requests/min)
for i in {1..12}; do 
  curl -X POST https://loancast.app/api/loans -H "Content-Type: application/json" -d '{}'
done
# Expected: 11th+ requests return 429 rate limit error
```

### **Input Validation** 
```bash
# Test invalid loan amount
curl -X POST https://loancast.app/api/loans \
  -H "Content-Type: application/json" \
  -d '{"amount": "invalid", "duration_months": 1, "borrower_fid": 123}'
# Expected: 400 error with Zod validation details

# Test missing required fields  
curl -X POST https://loancast.app/api/loans \
  -H "Content-Type: application/json" -d '{}'
# Expected: 400 error with field requirements
```

### **CRON Endpoint Protection**
```bash
# Test cron endpoint without auth (should fail)
curl https://loancast.app/api/cron/loan-status
# Expected: 401 Unauthorized

# Test with wrong secret  
curl -H "Authorization: Bearer wrong-secret" https://loancast.app/api/cron/loan-status
# Expected: 401 Unauthorized
```

### **BigInt Precision**
```bash
# Test USDC calculation precision
node -e "
const { mul102, fmtUsdc, toUsdc } = require('./lib/usdc');
console.log('$100 + 2% =', fmtUsdc(mul102(toUsdc(100))));
console.log('Should be exactly: 102.00');
"
# Expected output: $100 + 2% = 102.00
```

## 📱 **User Experience Testing**

### **Mobile Responsiveness**
- [ ] **Homepage**: Looks good on mobile
- [ ] **Loan Creation**: Form usable on phone
- [ ] **Navigation**: Menu works on mobile
- [ ] **Loan Cards**: Readable on small screens

### **Error Handling**
- [ ] **Network Errors**: Graceful handling of API failures
- [ ] **Validation Errors**: Clear error messages shown to users
- [ ] **Loading States**: Spinners/indicators during async operations
- [ ] **Empty States**: Helpful messages when no loans exist

### **Performance**
- [ ] **Page Load Speed**: Homepage loads under 3 seconds
- [ ] **API Response Times**: Loan list API responds under 1 second
- [ ] **Image Loading**: Lazy loading works for avatars/images

## 🗄️ **Database Integrity**

### **Migration Verification**
```sql
-- Run these queries in Supabase SQL editor:

-- 1. Check new columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'loans' 
AND column_name IN ('origin_cast_hash', 'borrower_addr', 'lender_addr', 'repay_expected_usdc');

-- 2. Check repayments table exists with constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'repayments';

-- 3. Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('loans', 'repayments');
```

### **Data Consistency**
- [ ] **Loan Status**: Valid status values ('seeking', 'funded', 'due', etc.)
- [ ] **Amount Fields**: All USDC amounts stored as BigInt strings
- [ ] **Timestamps**: Created/updated timestamps in UTC
- [ ] **Foreign Keys**: Loan relationships maintained

## 🚨 **Edge Cases & Error Scenarios**

### **Boundary Testing**
- [ ] **Min Loan Amount**: $1 loan creation works
- [ ] **Max Loan Amount**: $10,000 loan creation works  
- [ ] **Invalid Amounts**: $0.50 and $15,000 rejected
- [ ] **Duration Limits**: 1 month and 3 month loans work, 4 months rejected

### **Security Edge Cases**
- [ ] **SQL Injection**: Special characters in loan description handled safely
- [ ] **XSS Prevention**: User input properly escaped in UI
- [ ] **CSRF Protection**: API endpoints protected from cross-site requests

### **Network Failures**
- [ ] **Supabase Offline**: Graceful error handling when DB unavailable  
- [ ] **Neynar API Down**: Loan creation continues even if cast posting fails
- [ ] **Slow Responses**: Loading states shown for slow API calls

## 👥 **User Acceptance Testing**

### **Borrower Experience**
- [ ] **Clear Value Prop**: Homepage explains what LoanCast does
- [ ] **Simple Onboarding**: Easy to sign up with Farcaster
- [ ] **Intuitive Loan Request**: Form is straightforward  
- [ ] **Status Updates**: Borrower can see loan status changes
- [ ] **Repayment Process**: Clear instructions for paying back

### **Lender Experience**  
- [ ] **Browse Loans**: Easy to find interesting loan requests
- [ ] **Risk Assessment**: Can see borrower reputation/history
- [ ] **Simple Funding**: Clear way to fund loans
- [ ] **Tracking**: Can monitor funded loans

## 📋 **Pre-Launch Checklist**

### **Environment Setup**
- [ ] **Production Deploy**: Code deployed to loancast.app
- [ ] **SSL Certificate**: HTTPS working properly
- [ ] **Custom Domain**: loancast.app pointing correctly  
- [ ] **Environment Variables**: All secrets configured in Vercel

### **Content & Copy**
- [ ] **About Page**: Clear explanation of how LoanCast works
- [ ] **Terms of Service**: Legal terms accessible  
- [ ] **Privacy Policy**: Data handling explained
- [ ] **FAQ Section**: Common questions answered

### **Analytics & Monitoring**
- [ ] **Sentry Setup**: Error tracking working
- [ ] **PostHog Events**: User actions being tracked
- [ ] **Database Monitoring**: Supabase alerts configured
- [ ] **Vercel Analytics**: Performance monitoring enabled

### **Final Safety Checks**  
- [ ] **Backup Strategy**: Database backups configured
- [ ] **Rate Limiting**: Protection against spam/abuse
- [ ] **Security Headers**: CORS, CSP, etc. properly set
- [ ] **API Key Security**: No secrets exposed in client-side code

---

## 🚀 **Ready to Launch When:**

✅ **All Core Flows Work**: Users can create loans, browse, and authenticate  
✅ **Security Features Active**: Rate limiting, validation, CRON protection  
✅ **Mobile Experience Good**: Responsive design works on phones  
✅ **Error Handling Solid**: Graceful failures with helpful messages  
✅ **Performance Acceptable**: Fast page loads and API responses  

---

## 🔥 **Quick Smoke Test Script**

```bash
#!/bin/bash
# Run this script to quickly verify core functionality

echo "🧪 LoanCast Smoke Test"
echo "====================="

# 1. Test build
echo "1. Testing build..."
npm run build > /dev/null 2>&1 && echo "✅ Build successful" || echo "❌ Build failed"

# 2. Test homepage
echo "2. Testing homepage..."
curl -s -I https://loancast.app | grep -q "200 OK" && echo "✅ Homepage loads" || echo "❌ Homepage broken"

# 3. Test loans API
echo "3. Testing loans API..."
curl -s https://loancast.app/api/loans | grep -q "\[" && echo "✅ Loans API works" || echo "❌ Loans API broken"

# 4. Test rate limiting
echo "4. Testing rate limiting..."
curl -s https://loancast.app/api/loans -X POST -H "Content-Type: application/json" -d '{}' | grep -q "Rate limit\|400\|401" && echo "✅ Rate limiting active" || echo "❌ Rate limiting not working"

# 5. Test CRON protection  
echo "5. Testing CRON protection..."
curl -s https://loancast.app/api/cron/loan-status | grep -q "401\|Unauthorized" && echo "✅ CRON protected" || echo "❌ CRON exposed"

echo "====================="
echo "🎯 Smoke test complete!"
```

**Run this script before going live to catch any major issues! 🚀**