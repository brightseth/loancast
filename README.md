# 💸 LoanCast

> Social lending on Farcaster. No credit checks, no collateral—just reputation.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brightseth/loancast)
[![Live Demo](https://img.shields.io/badge/demo-loancast.app-purple)](https://loancast.app)
[![Farcaster](https://img.shields.io/badge/farcaster-@loancast-8A2BE2)](https://warpcast.com/loancast)

## 🚀 Overview

LoanCast is a decentralized peer-to-peer lending platform built on [Farcaster](https://farcaster.xyz), enabling trust-based loans using USDC on Base blockchain. Users build reputation through successful loans, unlocking better terms over time.

## ✨ Features

### Core Functionality
- 🏦 **P2P Lending** - Request and fund loans directly between users
- 💳 **USDC Payments** - All transactions in USDC on Base L2
- 📈 **Fixed 2% Monthly Rate** - Simple, transparent pricing
- 🔐 **Sign In With Farcaster** - No passwords, just your Farcaster account

### Reputation System
- 🏆 **Credit Scores** (0-1000 range)
- 🎖️ **14 Achievement Badges** with rarity tiers
- 📊 **Public Loan History** on profile pages
- 🔥 **Repayment Streaks** tracking

### Social Features
- 📢 **Auto-post to Farcaster** when creating loans
- 💬 **Quote-cast repayments** to build reputation
- 👤 **Profile Pages** with loan history
- 🔍 **Explore Feed** with search & filters

### Notifications & Automation
- 🔔 **Real-time notifications** for loan events
- 📧 **Email reminders** (3 days, 1 day, overdue)
- 🤖 **Automated default detection**
- 📱 **Mobile-responsive** interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Neynar SDK (Sign In With Farcaster)
- **Blockchain**: Base L2, USDC
- **Analytics**: PostHog, Sentry
- **Email**: Resend/SendGrid
- **Hosting**: Vercel

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Neynar API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/brightseth/loancast.git
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
# Database (Supabase)
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Farcaster Integration (Neynar)
NEYNAR_API_KEY=NEYNAR_...
NEXT_PUBLIC_NEYNAR_CLIENT_ID=...

# Optional Services
NEXT_PUBLIC_POSTHOG_KEY=phc_...
SENTRY_AUTH_TOKEN=...
RESEND_API_KEY=re_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-secret-key
```

5. Set up the database:
   - Create a new Supabase project
   - Run database migrations:
   ```bash
   npx supabase db push
   ```

6. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## 📁 Project Structure

```
loancast/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication
│   │   ├── loans/         # Loan CRUD
│   │   ├── cron/          # Scheduled jobs
│   │   └── notifications/ # Notification system
│   ├── loans/             # Loan pages
│   ├── profile/           # User profiles
│   └── explore/           # Public feed
├── components/            # React components
│   ├── LoanCard.tsx      # Core loan display
│   ├── ReputationCard.tsx # Badges & scoring
│   └── NotificationBell.tsx # Real-time alerts
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Database client
│   ├── neynar.ts         # Farcaster integration
│   ├── reputation.ts     # Scoring algorithms
│   └── email.ts          # Email service
└── supabase/             # Database schemas
```

## 🔄 Loan Lifecycle

```mermaid
graph LR
    A[Create Request] --> B[Post to Farcaster]
    B --> C[Open for Funding]
    C --> D[Lender Funds]
    D --> E[Borrower Repays]
    E --> F[Reputation Updated]
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/loans` | Create loan request |
| GET | `/api/loans` | Get user's loans |
| POST | `/api/loans/[id]/fund` | Fund a loan |
| POST | `/api/loans/[id]/mark-repaid` | Mark as repaid |
| GET | `/api/profiles/[fid]` | Get user profile |
| GET | `/api/reputation/[fid]` | Get reputation score |
| GET | `/api/notifications` | Get notifications |

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brightseth/loancast)

1. Click the button above
2. Configure environment variables in Vercel dashboard
3. Deploy!

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🧪 Testing

```bash
# Run tests (coming soon)
npm test

# Test email templates locally
open http://localhost:3000/api/test-email?days=3

# Test cron jobs
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/email-reminders
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📈 Current Status

- ✅ All core features implemented
- ✅ Production deployed at [loancast.app](https://loancast.app)
- ✅ Real Farcaster posting working
- ✅ Email reminders configured
- ✅ Legal docs (Terms & Privacy)
- ⏳ Comprehensive testing suite pending

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [loancast.app](https://loancast.app)
- **Farcaster**: [@loancast](https://warpcast.com/loancast)
- **GitHub**: [brightseth/loancast](https://github.com/brightseth/loancast)

## 💬 Support

For support, reach out on Farcaster [@loancast](https://warpcast.com/loancast) or open an issue.

## 🙏 Acknowledgments

- Built on [Farcaster](https://farcaster.xyz)
- Powered by [Neynar](https://neynar.com)
- Deployed on [Vercel](https://vercel.com)

---

**⚠️ Disclaimer**: This is experimental software for social lending. Use at your own risk. Not financial advice.