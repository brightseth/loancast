# MVP Ruthless Simplification Plan

Based on codebase analysis, we have significant complexity creep that will hurt maintainability and create technical debt. Here's a plan to streamline to the absolute essentials.

## 🎯 **Core MVP User Journey**
1. User signs in with Farcaster
2. User creates loan request → cast goes to Farcaster  
3. Lender funds via collect/USDC transfer
4. Borrower repays via USDC transfer
5. Both parties see transaction history

**Everything else is nice-to-have.**

## 🔥 **DELETE Immediately (High Risk, Low Value)**

### API Endpoints to Remove (~30 endpoints)
```
/api/admin/* (except essential funding tools)
/api/cron/* (all automated jobs - manual for now)
/api/delete-* (dangerous, not needed)
/api/update-genesis-stats
/api/add-genesis-loan  
/api/user/email-preferences
/api/user/verify-identity
/api/feedback
/api/stats (disabled anyway)
/api/profiles/[fid] (use Neynar directly)
/api/reputation/[fid] (over-engineered)
/api/loans/open (redundant with main loans API)
/api/loans/list (redundant with main loans API)
/api/casts (not needed)
/api/health/rpc
```

### Library Files to Remove (~15 files)
```
lib/analytics.ts (over-engineered)
lib/email.ts (not using email yet)
lib/notifications.ts (complex, not core)
lib/reputation.ts (over-engineered)
lib/identity.ts (use simple FID only)
lib/verification.ts (complex, not needed)
lib/farcaster-indexer.ts (webhook handles this)
lib/database-utils.ts (inline simple queries)
lib/feature-flags.ts (use simple flags.ts)
lib/rate-limit.ts (keep only memory version)
lib/rate-limiting.ts (keep only memory version) 
lib/webhook-security.ts (use improved version only)
lib/launch-guard.ts (not needed)
lib/defaults.ts (inline constants)
lib/neynar-post.ts (use main neynar.ts)
```

### Pages to Simplify
```
/admin → Simple status page only
/profile/[fid] → Remove (use external Farcaster profiles)
/about → Static content only
/dashboard/lending → Keep but simplify (already done)
```

## 🏗 **CONSOLIDATE (Reduce Maintenance Burden)**

### 1. Single Rate Limiting System
**Keep**: `lib/rate-limit-memory.ts`  
**Remove**: `lib/rate-limit.ts`, `lib/rate-limiting.ts`
**Action**: Update all imports to use memory version only

### 2. Single Webhook Handler  
**Keep**: `app/api/webhooks/neynar-secure/route.ts`
**Remove**: `app/api/webhooks/neynar/route.ts`, `app/api/webhooks/cast-collection/route.ts`
**Action**: Update Neynar webhook URL, remove old handlers

### 3. Simplified Authentication
**Pattern**: Every protected route checks `auth.role() = 'authenticated'` or `'service_role'`
**Remove**: Complex session management, multiple auth patterns
**Action**: Standardize on Supabase auth only

### 4. Core Database Schema Only
**Keep**: `loans`, `users`, `webhook_inbox`, `loan_events`
**Consider Removing**: `reactions`, `notifications`, `bids`, `feedback`, `stats_cache`
**Action**: Focus on loan lifecycle only

## 🎯 **REFACTOR Core Components**

### 1. Simplified Loan API (`/api/loans/route.ts`)
```typescript
// ONLY these operations:
POST /api/loans          // Create loan request
GET  /api/loans          // List loans (with simple filters)
GET  /api/loans/[id]     // Get loan details
POST /api/loans/[id]/fund      // Mark as funded (manual for now)  
POST /api/loans/[id]/repaid    // Mark as repaid (manual for now)
```

### 2. Ultra-Simple Webhook (`/api/webhooks/neynar-secure/route.ts`)
```typescript
// ONLY handle:
- cast.deleted → delete unfunded loans
- Store all events in webhook_inbox for audit
- NO bid parsing, NO auto-funding, NO analytics
```

### 3. Minimal Frontend Pages
```typescript
// KEEP:
/ (landing)
/loans (borrower dashboard)  
/loans/new (create loan)
/loans/[id] (loan details)
/explore (browse loans)

// REMOVE:
/dashboard/lending (move to /loans with tab)
/admin (replace with simple status)
/profile/[fid] (remove)
/p/[fid] (remove)
```

## 📦 **Proposed New File Structure**

```
app/
├── api/
│   ├── auth/neynar/route.ts           # Farcaster auth only
│   ├── loans/route.ts                 # Core CRUD
│   ├── loans/[id]/route.ts           # Loan details
│   ├── loans/[id]/fund/route.ts      # Manual funding
│   ├── loans/[id]/repaid/route.ts    # Manual repayment  
│   └── webhooks/neynar/route.ts      # Single webhook handler
├── loans/
│   ├── page.tsx                       # Borrower + lender dashboard
│   ├── new/page.tsx                   # Create loan
│   └── [id]/page.tsx                 # Loan details
├── explore/page.tsx                   # Browse loans
└── page.tsx                          # Landing

lib/
├── supabase.ts                       # Database only
├── neynar.ts                        # Farcaster API only  
├── usdc.ts                          # USDC utilities only
├── flags.ts                         # Simple feature flags
├── rate-limit.ts                    # Single rate limiter
└── webhook-security.ts              # Single webhook handler
```

## 🧪 **Simplified Data Model**

```sql
-- Core tables only
loans (id, cast_hash, borrower_fid, lender_fid, amount, repay_amount, status, created_at)
users (fid, username, pfp_url, last_seen)  
webhook_inbox (event_id, payload, processed_at)
loan_events (loan_id, kind, meta, created_at)

-- Remove: reactions, notifications, bids, feedback, stats_cache, rate_limits
```

## 🚀 **Implementation Plan**

### Phase 1: Remove Dead Weight (1-2 hours)
1. Delete unused API endpoints 
2. Delete unused lib files
3. Update all imports
4. Remove unused database tables

### Phase 2: Consolidate (2-3 hours)  
1. Merge rate limiting into single implementation
2. Replace old webhook with secure version
3. Simplify authentication patterns
4. Consolidate frontend pages

### Phase 3: Test & Deploy (1 hour)
1. Test core user journey works
2. Verify no broken imports
3. Deploy simplified version

## 📊 **Expected Results**

**Before**: 60+ API routes, 25+ lib files, complex interdependencies  
**After**: ~10 core API routes, ~6 essential lib files, clear separation

**Benefits**:
- ✅ **Faster development** (less to maintain)
- ✅ **Fewer bugs** (simpler code paths)  
- ✅ **Better security** (smaller attack surface)
- ✅ **Easier deployment** (fewer dependencies)
- ✅ **Clearer mental model** (focused on core value)

## 🛡 **What We Keep (Non-Negotiable)**

- Farcaster authentication (core value prop)
- Loan CRUD operations (essential function)
- USDC amount calculations (financial correctness)
- Webhook security (prevents abuse)
- Basic audit trail (regulatory/debugging)

## ❓ **Questions for You**

1. **Admin tools**: Keep minimal funding/repayment tools or go 100% manual?
2. **Analytics**: Remove all stats collection or keep basic counters?  
3. **Notifications**: Remove entirely or keep simple in-app status?
4. **Reputation**: Remove complex scoring or keep simple completion rate?

**My recommendation**: Remove everything non-essential. Add features back **after** the core is bulletproof and you have real user feedback.

The goal is to launch with something **simple that works** rather than something **complex that breaks**.