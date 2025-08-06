# LoanCast - Social Lending on Farcaster

Make raising and tracking social-credit loans on Farcaster one tap.

## Overview

LoanCast is a mini-app for Farcaster that enables users to create, fund, and track social loans using USDC. Borrowers can create loan requests that become collectible casts, and lenders can bid on these loans to earn yield.

## Features

### Core Functionality
- **Trust-based lending**: No escrow or collateral - powered by social reputation
- **One-tap loan creation**: Simple form with risk disclosure
- **Farcaster integration**: Loan requests become collectible casts
- **Dashboard**: Track loans as borrower or lender with detailed status

### Reputation & Trust System
- **Comprehensive reputation profiles**: Credit scores, repayment history, social metrics
- **On-chain verification**: Transaction verification on Base blockchain
- **Reputation badges**: Achievement system for reliable borrowers
- **Social capital display**: Follower count, cast count, account age

### Risk Management
- **Grace period handling**: 48-hour grace period with automated reminders
- **Default process**: Staged approach from reminder to public warning to default
- **Platform statistics**: Success rates by category, average APR, repayment rates
- **Clear risk disclaimers**: Transparent about trust-based nature

### Discovery & Analytics
- **Public explore feed**: Browse open loans with filtering
- **Success metrics**: Platform-wide statistics and trends
- **Lender leaderboards**: Top performers by volume and success rate
- **Real-time activity**: 24-hour loan and repayment tracking

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Auth**: Neynar Signer & FID OAuth
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: viem for Base chain interactions
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Neynar API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/loancast/miniapp.git
cd loancast
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
NEYNAR_API_KEY=your_neynar_api_key
NEYNAR_CLIENT_ID=your_neynar_client_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
BASE_RPC_URL=https://mainnet.base.org
HUBBLE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Set up the database:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`

6. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Project Structure

```
loancast/
├── app/                  # Next.js 14 app directory
│   ├── api/             # API routes
│   ├── loans/           # Loan pages
│   └── explore/         # Public feed
├── components/          # React components
├── lib/                 # Utility functions
├── supabase/           # Database schema
└── public/             # Static assets
```

## API Routes

- `POST /api/loans` - Create a new loan request
- `GET /api/loans` - Get loans (filtered by borrower/lender)
- `GET /api/loans/open` - Get all open loans (public)
- `POST /api/loans/:id/mark-repaid` - Mark loan as repaid
- `POST /api/webhook/hubble` - Receive auction events

## Development Roadmap

### Week 1
- [x] Project setup and authentication
- [x] Loan form and cast creation
- [x] Basic dashboard

### Week 2
- [ ] Auction listener integration
- [ ] Repayment flow
- [ ] Enhanced UI/UX

### Week 3
- [ ] Cron job for reminders
- [ ] Frame integration
- [ ] Public feed improvements

### Week 4+
- [ ] Reputation scoring v1
- [ ] Analytics dashboard
- [ ] Mobile optimization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Contact

Built by the LoanCast team. Follow us on Farcaster: [@loancast](https://warpcast.com/loancast)

*Updated: Profile pages now include fallback test users for development.*