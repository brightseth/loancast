# Real-time Bidding Implementation for LoanCast

## Architecture Overview
LoanCast uses **Farcaster cast replies** as the bidding mechanism (not on-chain), so we're implementing **Option 3B: Neynar Webhooks** for real-time bid capture.

## Components Created

### 1. Neynar Webhook Handler
**File:** `app/api/webhooks/neynar-bids/route.ts`
- Receives cast.created events from Neynar
- Parses bid amounts from cast text (supports multiple formats)
- Updates bids table with proper status tracking
- Handles bid updates (higher bids replace lower ones)

### 2. SSE Streaming Endpoint  
**File:** `app/api/loans/[id]/bids/stream/route.ts`
- Server-Sent Events for real-time UI updates
- Streams bid updates to connected clients
- Polls database every 5 seconds (can upgrade to Supabase Realtime)

### 3. Live Bids UI Component
**File:** `components/LiveBids.tsx`
- Shows current leader with trophy icon
- Lists all bids sorted by amount
- Real-time updates via SSE
- Connection status indicator

### 4. Webhook Registration Script
**File:** `scripts/register-neynar-webhook.js`
- Registers webhook with Neynar API
- Lists existing webhooks
- Can delete webhooks with `node script.js delete <webhook_id>`

## Setup Instructions

### 1. Add Neynar API Key
```bash
# Add to .env.local
NEYNAR_API_KEY=your_neynar_api_key_here
```

### 2. For Local Testing (use ngrok)
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Create tunnel
ngrok http 3002

# Terminal 3: Register webhook with ngrok URL
WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/neynar-bids \
node scripts/register-neynar-webhook.js
```

### 3. For Production
```bash
# Register with production URL
WEBHOOK_URL=https://loancast.app/api/webhooks/neynar-bids \
node scripts/register-neynar-webhook.js
```

## Database Schema
```sql
-- Current bids table structure
CREATE TABLE bids (
  id UUID PRIMARY KEY,
  loan_id UUID REFERENCES loans(id),
  bidder_fid INTEGER NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_timestamp TIMESTAMP NOT NULL,
  bid_sequence INTEGER,
  status TEXT CHECK (status IN ('winning', 'losing', 'accepted')),
  cast_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Bid Parsing Patterns
The webhook handler recognizes these bid formats in cast replies:
- `bid 80` or `Bid 80`
- `$80` or `80 USDC`
- `80` (just the number)
- `collect for $80`

## Testing the Flow

### 1. Manual Testing (Current)
```bash
# Your bid is already recorded
node scripts/solienne-loan/check-bids-schema.js

# Monitor for settlement
node scripts/solienne-loan/monitor-settlement.js
```

### 2. With Live Webhooks
1. Reply to loan cast with bid amount
2. Webhook receives event → parses bid → updates DB
3. SSE streams update to UI
4. LiveBids component shows new bid

## Settlement Process (24 hours)
When auction ends after 24 hours:
1. Winning bid (highest amount) gets accepted
2. Loan status changes from 'seeking' to 'funded'
3. Funding transaction initiated
4. Solienne receives funds
5. 5-day repayment timer starts

## Current Status
- ✅ Seth's $80 bid recorded (winning bid)
- ⏰ Auction ends: Aug 17, 2025, 1:36 AM (~22 hours remaining)
- 🎯 Ready for settlement and funding

## Next Steps
1. **Optional:** Set up Neynar webhook for production
2. **Required:** Wait for auction settlement
3. **Automated:** Funding will proceed after settlement
4. **Monitor:** Repayment on day 5 (Aug 21)

## UI Integration
To add LiveBids to loan detail page:
```tsx
// In app/loans/[id]/page.tsx
import { LiveBids } from '@/components/LiveBids'

// Add in the JSX where you want bids displayed
{loan.status === 'seeking' && (
  <LiveBids 
    loanId={loan.id} 
    initialBids={loan.bids || []}
  />
)}
```

## Production Checklist
- [ ] Add NEYNAR_API_KEY to production env
- [ ] Deploy webhook handler
- [ ] Register webhook with production URL
- [ ] Test bid parsing with various formats
- [ ] Monitor webhook logs for errors
- [ ] Add error alerting for failed bid captures

## Monitoring
```bash
# View webhook logs (if using Vercel)
vercel logs --filter="Neynar Bid Webhook"

# Check bid status
curl https://loancast.app/api/loans/[loan-id]
```

This implementation provides a clean, production-ready solution for real-time bid capture and display using Farcaster's native interaction model.