# Neynar Webhook Setup Guide

## ✅ Confirmed Available Events

According to Neynar API documentation, these webhook events are available:

1. **cast.created** ✅ - When someone posts a cast
2. **cast.deleted** ✅ - When someone deletes a cast 
3. **user.created** - When new user joins Farcaster
4. **user.updated** - When user updates profile
5. **follow.created** - When someone follows another user
6. **follow.deleted** - When someone unfollows 
7. **reaction.created** ✅ - When someone likes/recasts
8. **reaction.deleted** - When someone unlikes/unrecasts

## 🔧 Setup Instructions

### 1. Environment Variable (REQUIRED)
Add to Vercel environment variables:
```
NEYNAR_WEBHOOK_SECRET=lyv0ByQAl1QM2MhY9vvLZ1ErJ
```

### 2. Neynar Dashboard Configuration
- **Webhook URL**: `https://loancast.app/api/webhooks/neynar`
- **Events to enable**:
  - ✅ `cast.created` (track loan replies/bids)
  - ✅ `cast.deleted` (auto-delete loans) 
  - ✅ `reaction.created` (track engagement)
- **Secret**: `lyv0ByQAl1QM2MhY9vvLZ1ErJ`

### 3. Optional Filters
For cast events, you can add filters:
- `author_fids`: Only track specific users
- `text`: Regex pattern to match loan casts
- `parent_urls`: Track specific channels only

## 🧪 Testing

1. **Test webhook endpoint**: 
   ```bash
   curl https://loancast.app/api/test-webhook
   ```

2. **Manual test cast deletion**:
   ```bash
   curl -X POST https://loancast.app/api/test-webhook
   ```

3. **Real test**: Create loan → Delete cast → Should disappear from app

## 🔍 Debugging

If loans aren't being deleted automatically:

1. Check Vercel environment variables include `NEYNAR_WEBHOOK_SECRET`
2. Verify webhook is active in Neynar dashboard 
3. Check webhook logs in Neynar dashboard for errors
4. Test webhook endpoint responds correctly

## 📋 Current Implementation

- **Unfunded loans** (`status: open`): Completely deleted
- **Funded loans** (`status: funded`): Marked as `status: deleted` 
- **Notifications**: Sent to affected users
- **Cleanup**: Associated bids, reactions, notifications removed