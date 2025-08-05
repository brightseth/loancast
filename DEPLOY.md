# LoanCast Deployment Guide

## Quick Start (15 minutes)

### 1. Set up Supabase (5 min)
- Create account at [supabase.com](https://supabase.com)
- Create new project
- Go to SQL Editor → New Query
- Paste contents of `/supabase/simple-schema.sql`
- Click Run

### 2. Get API Keys (5 min)
- **Supabase**: Project Settings → API
  - Copy URL, anon key, and service role key
- **Neynar**: [dev.neynar.com](https://dev.neynar.com/)
  - Create app
  - Copy API key

### 3. Configure Environment (3 min)
```bash
cp .env.example .env.local
```

Update `.env.local` with your keys:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
NEYNAR_API_KEY=NEYNAR_API_DOCS_DEMO
```

### 4. Deploy to Vercel (2 min)
```bash
npx vercel
```

Add environment variables in Vercel dashboard.

## That's it! 🎉

Your LoanCast is now live with:
- Real Farcaster authentication
- Persistent database
- Cast creation
- USDC transactions (via Farcaster frames)

## What's Working Now

✅ **Authentication** - Users login with Farcaster  
✅ **Create Loans** - Posts real casts to Farcaster  
✅ **Database** - All loans stored in Supabase  
✅ **Loan Management** - Track borrowed/lent/watching  
✅ **Activity Feed** - Shows recent loans  

## Next Steps (Optional)

1. **Custom Domain** - Add yourdomain.com in Vercel
2. **Frame Transactions** - Users can fund/repay with Farcaster's built-in wallet
3. **Monitoring** - Set up Vercel Analytics
4. **Launch** - Post in /loancast channel!

## Testing Checklist

- [ ] Login with Farcaster works
- [ ] Create a test loan
- [ ] Check it appears in activity feed
- [ ] View it in My Loans
- [ ] Loan shows on explore page

## Support

- Issues? Check console for errors
- Database problems? Check Supabase logs
- Auth issues? Verify Neynar API key