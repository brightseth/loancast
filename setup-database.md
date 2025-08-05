# Database Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Save your project URL and keys

## Step 2: Run Database Schema

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the contents of `/supabase/simple-schema.sql`
5. Click "Run" to execute

## Step 3: Update Environment Variables

Create a `.env.local` file with your real values:

```bash
# Copy from .env.example and fill in your values
cp .env.example .env.local
```

Then update with:
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase API settings
- `SUPABASE_SERVICE_KEY` - From Supabase API settings (service role)
- `NEYNAR_API_KEY` - From [Neynar Dashboard](https://dev.neynar.com/)

## Step 4: Test Connection

Run the development server:
```bash
npm run dev
```

The app should now connect to your real Supabase instance!

## Step 5: Enable Neynar Sign In

1. Get your Neynar API key from [dev.neynar.com](https://dev.neynar.com/)
2. Add it to `.env.local`
3. The app will automatically use real Farcaster auth when the key is present

## Optional: Set up custom domain

1. In Vercel, add your custom domain
2. Update `NEXT_PUBLIC_APP_URL` in production environment variables