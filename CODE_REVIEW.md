# LoanCast - Code Review Package

## 🎯 Project Overview

**LoanCast** is a Farcaster mini-app that enables social lending through collectible casts. Users can create loan requests that become Farcaster casts, which lenders can bid on to provide funding.

**Live Demo**: https://loancast-fb7nwprwz-edenprojects.vercel.app  
**Frame URL**: https://loancast-fb7nwprwz-edenprojects.vercel.app/frame

## 🏗️ Architecture

### **Tech Stack**
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Mock auth (Neynar integration ready)
- **Blockchain**: Base network, viem for USDC verification
- **Deployment**: Vercel with cron jobs

### **Key Features**
- ✅ Fixed 2% monthly lending rate (24% APR)
- ✅ 1, 2, or 3 month loan terms
- ✅ Farcaster Frame integration
- ✅ Cast preview in loan creation
- ✅ Trust-based lending (no escrow)
- ✅ Reputation scoring system
- ✅ On-chain repayment verification

## 📁 File Structure

```
loancast/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # Backend API routes
│   │   ├── loans/                # Loan CRUD operations
│   │   ├── stats/                # Platform statistics
│   │   ├── frame/                # Farcaster Frame endpoints
│   │   └── cron/                 # Background jobs
│   ├── loans/                    # Loan pages
│   ├── explore/                  # Public loan discovery
│   └── layout.tsx                # Root layout with Frame metadata
├── components/                   # React components
│   ├── LoanForm.tsx              # Main loan creation form
│   ├── LoanCard.tsx              # Loan display component
│   ├── ReputationProfile.tsx     # User reputation display
│   └── StatsCard.tsx             # Platform statistics
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Database client & types
│   ├── neynar.ts                 # Farcaster cast creation
│   ├── verification.ts           # On-chain payment verification
│   └── defaults.ts               # Grace period handling
├── supabase/                     # Database schema
└── README.md                     # Documentation
```

## 🔑 Core Components

### **1. Loan Creation Flow** (`components/LoanForm.tsx`)
- Fixed 2% monthly rate display
- 1/2/3 month term selection
- Real-time cast preview
- Form validation with Zod
- Risk disclaimers

### **2. Farcaster Integration** (`app/frame/` & `app/api/frame/`)
- Dynamic Frame image generation
- Frame metadata for social sharing
- Individual loan frames
- Cast creation via Neynar API

### **3. Database Layer** (`lib/supabase.ts` & `supabase/schema.sql`)
- Loans, users, repayments tables
- Reputation scoring fields
- Grace period tracking
- Row Level Security policies

### **4. Verification System** (`lib/verification.ts`)
- Base network USDC transaction verification
- On-chain repayment confirmation
- Automatic reputation updates

## 🚨 Security Considerations

### **Trust-Based Model**
- **No escrow** - borrowers receive funds directly
- **Social reputation** is the primary collateral
- **Clear risk warnings** throughout the UI
- **Grace periods** before marking defaults

### **Data Protection**
- Environment variables for API keys
- Row Level Security in Supabase
- Input validation and sanitization
- Rate limiting on API endpoints

### **Authentication**
- Currently mock auth for development
- Neynar integration ready for production
- FID-based user identification

## 🎨 UI/UX Highlights

### **Cast-Centric Design**
- Real-time cast preview in loan form
- Cast hash display in loan cards
- Direct links to Warpcast
- Frame integration for in-feed interactions

### **Trust Indicators**
- Reputation scores and badges
- Repayment history display
- Social metrics (followers, casts)
- Clear APR disclosure (24% annual)

### **Mobile-First**
- Responsive Tailwind CSS design
- Touch-friendly buttons
- Optimized for Farcaster mobile clients

## 🔄 Data Flow

1. **Loan Creation**:
   - User fills form → Cast preview updates → API creates loan → Neynar posts cast → Supabase stores data

2. **Loan Discovery**:
   - Public API → Explore page → Individual loan pages → Cast links

3. **Repayment**:
   - Borrower submits tx hash → Base network verification → Reputation update → Cast confirmation

## 📊 Business Logic

### **Pricing Model**
- **Fixed Rate**: 2% per month (24% APR)
- **No Platform Fee**: Currently (can be added later)
- **Transparent Calculations**: Interest = Principal × 0.02 × Months

### **Risk Management**
- **Grace Periods**: 48 hours after due date
- **Reputation Impact**: Credit scores affected by defaults
- **Social Pressure**: Public cast history

### **Growth Mechanics**
- **Collectible Casts**: Natural viral sharing
- **Reputation Building**: Incentive for good behavior
- **Social Proof**: Public success metrics

## 🧪 Testing Recommendations

### **Frame Testing**
1. Deploy to Vercel (done)
2. Share frame URL in Farcaster cast
3. Test button interactions in mobile/desktop clients
4. Verify frame images load correctly

### **Flow Testing**
1. Create loan request → Verify cast preview accuracy
2. Browse loans → Check filtering and display
3. Test reputation calculations
4. Mock repayment flow

### **Edge Cases**
- Invalid transaction hashes
- Network timeouts
- Large loan amounts
- Expired due dates

## 🚀 Deployment Status

**Current Status**: ✅ **LIVE ON VERCEL**
- Production URL: https://loancast-fb7nwprwz-edenprojects.vercel.app
- Environment variables configured
- Database connected
- Frame integration working

## 🔮 Next Steps for Production

### **Authentication**
- Complete Neynar OAuth integration
- Replace mock login with real Farcaster auth
- Implement proper session management

### **Monitoring**
- Add error tracking (Sentry)
- Implement analytics (PostHog/Mixpanel)
- Set up uptime monitoring

### **Legal/Compliance**
- Terms of service
- Privacy policy
- Risk disclosures
- Jurisdiction considerations

### **Features**
- Real cast posting to Farcaster
- Email/DM reminder system
- Advanced reputation badges
- Loan categories/tags

## 💡 Innovation Notes

**LoanCast pioneers the "Cast as Collateral" concept** - where social reputation and public accountability replace traditional financial collateral. This creates a new primitive for decentralized, trust-based lending that leverages social networks for credit decisions.

The app demonstrates how Farcaster can be more than just social media - it can be infrastructure for financial services built on social trust.

---

## 📋 Review Checklist for Engineers

- [ ] **Security**: Review API security, input validation, RLS policies
- [ ] **Performance**: Check database queries, caching, bundle size
- [ ] **Reliability**: Error handling, edge cases, fallbacks
- [ ] **Scalability**: Database indexes, API rate limits, caching strategy  
- [ ] **UX**: Mobile responsiveness, loading states, error messages
- [ ] **Business Logic**: Pricing calculations, reputation algorithms
- [ ] **Integration**: Farcaster Frame compliance, Neynar API usage
- [ ] **Legal**: Risk disclosures, terms of service requirements

Ready for your team's feedback! 🎯