# Real-time Bid Streaming Setup for LoanCast

## Current State
- ✅ Seth's $80 bid recorded manually
- ⏰ Auction ends: Aug 17, 2025, 1:36 AM (~23 hours)
- 🎯 Need: Real-time bid capture from Farcaster interactions

## Implementation Options

### Option 1: Neynar Webhook (Recommended - Simplest)
```javascript
// app/api/webhooks/neynar-bids/route.ts
export async function POST(req: Request) {
  const event = await req.json();
  
  // Filter for cast interactions on loan casts
  if (event.type === 'cast.created' || event.type === 'reaction.created') {
    // Parse for bid syntax (e.g., "bid 100" or collect action)
    // Update bids table
    // Broadcast via SSE/WebSocket
  }
  
  return Response.json({ received: true });
}
```

### Option 2: Hub Events Subscription (Full Control)
```javascript
// scripts/hub-bid-listener.js
import { getSSLHubRpcClient, HubEventType } from "@farcaster/hub-nodejs";

const client = getSSLHubRpcClient("hub.farcaster.xyz:2283");
const sub = await client.subscribe({ 
  eventTypes: [HubEventType.MERGE_MESSAGE] 
});

for await (const event of sub) {
  // Filter for loan cast interactions
  // Parse bid amounts
  // Update database
}
```

### Option 3: Hybrid (Neynar + Manual Fallback)
- Primary: Neynar webhook for automated capture
- Fallback: Manual bid recording script (already created)
- UI: SSE endpoint for live updates

## Database Schema (Current)
```sql
bids table:
- id: uuid
- loan_id: uuid
- bidder_fid: integer
- bid_amount: decimal
- bid_timestamp: timestamp
- bid_sequence: integer
- status: text (winning/losing/accepted)
- cast_hash: text
- created_at: timestamp
- updated_at: timestamp
```

## UI Components Needed
1. **Live Bid Feed** (components/LiveBids.tsx)
   - SSE connection to /api/bids/stream
   - Show leader, bid count, last activity
   
2. **Countdown Timer** (already exists)
   - Shows time to settlement
   
3. **Settlement Handler**
   - At 24h mark, accept winning bid
   - Update loan status to 'funded'
   - Trigger funding flow

## Quick Setup for Neynar Webhook

1. **Create webhook endpoint**:
```bash
# Already exists at app/api/webhooks/neynar/route.ts
# Need to enhance for bid parsing
```

2. **Register webhook with Neynar**:
```bash
curl -X POST https://api.neynar.com/v2/farcaster/webhook \
  -H "api_key: YOUR_NEYNAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "loancast-bids",
    "url": "https://loancast.app/api/webhooks/neynar-bids",
    "events": ["cast.created", "reaction.created"]
  }'
```

3. **Add SSE endpoint** for live UI updates:
```typescript
// app/api/bids/stream/route.ts
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to bid changes
      // Send SSE events
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

## Next Steps
1. ✅ Manual bid recorded
2. ⏳ Wait for auction settlement (~23 hours)
3. 🔜 Implement real-time streaming (optional but recommended)
4. 📊 Monitor settlement and capture proof

## Testing the Current Setup
```bash
# Check bid is visible
curl http://localhost:3002/api/loans/0fd92bda-5b08-48b0-84f8-403c10d2929a

# Monitor auction
node scripts/solienne-loan/monitor-settlement.js

# When settled, will auto-trigger funding
```