# LoanCast Miniapp

A native-like Farcaster miniapp for social lending.

## Features

- **Quick Loan Requests**: Streamlined form with auto-cast generation
- **Browse & Fund**: View active loans and fund with one click
- **Reputation View**: See borrower history and repayment rates
- **Wallet Integration**: Seamless USDC transactions via Farcaster wallet
- **Mobile Optimized**: Native-like experience in mobile clients

## Setup

### 1. Install Dependencies
```bash
npm install @farcaster/miniapp-sdk
```

### 2. Environment Variables
Add to your `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_key
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0xa0b86a33e6786d8ed91dcddaa4635f95d3d9b9b2
```

### 3. Brand Assets
Ensure these files exist in `/public/brand/`:
- `LoanCast_Icon_Square.png` (1024x1024px)
- `LoanCast_Social_Preview.png` (1200x630px)

### 4. Deploy & Configure
1. Deploy to production (Vercel recommended)
2. Verify manifest at `https://your-domain.com/.well-known/farcaster.json`
3. Test miniapp at `https://your-domain.com/miniapp`

### 5. Enable in Farcaster
1. Enable Developer Mode in Farcaster settings
2. Add your miniapp URL for testing
3. Submit for verification when ready

## File Structure

```
app/
├── miniapp/
│   ├── page.tsx          # Main miniapp interface
│   └── layout.tsx        # Miniapp-specific layout
├── api/
│   ├── manifest/         # Serves farcaster.json dynamically
│   └── webhooks/miniapp/ # Handles miniapp events
components/
├── MiniAppLoanForm.tsx   # Specialized loan form for miniapp
└── ui/LoadingSpinner.tsx # Loading component
```

## API Endpoints

- `GET /.well-known/farcaster.json` → Miniapp manifest
- `POST /api/webhooks/miniapp` → Webhook for miniapp events
- `GET /miniapp` → Miniapp home page

## Development

```bash
# Run setup check
node scripts/setup-miniapp.js

# Start development server
npm run dev

# Test miniapp at http://localhost:3000/miniapp
```

## Publishing

1. **Test thoroughly** in development mode
2. **Deploy to production** with proper SSL certificate
3. **Verify manifest** is accessible at `/.well-known/farcaster.json`
4. **Enable notifications** by implementing webhook handlers
5. **Submit for verification** at [miniapps.farcaster.xyz](https://miniapps.farcaster.xyz/docs/guides/publishing)

## Key Features Implementation

### Loan Request Flow
1. User fills out miniapp form
2. SDK authenticates via Farcaster
3. Loan created in database
4. Auto-generates cast with loan details
5. Cast posted to user's timeline

### Funding Flow
1. User browses active loans in miniapp
2. Clicks fund on a loan
3. SDK initiates USDC wallet transaction
4. Transaction confirmed and loan updated
5. Notification sent to borrower

### Reputation System
- Displays borrower's repayment history
- Shows success rate and total loans
- Updates in real-time as loans are repaid

## Best Practices

- **Mobile-first design** for optimal Farcaster client experience
- **Minimal loading times** with efficient data fetching
- **Error handling** for network and wallet issues  
- **Progressive enhancement** for different client capabilities
- **Privacy-conscious** data handling

## Troubleshooting

**Manifest not loading?**
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Verify SSL certificate is valid
- Test manifest URL directly

**SDK errors?**  
- Ensure miniapp is accessed within Farcaster client
- Check browser console for detailed errors
- Verify Farcaster Developer Mode is enabled

**Wallet transactions failing?**
- Confirm USDC contract address is correct
- Check user has sufficient balance
- Verify network connection

## Support

For issues or questions:
- Check [Farcaster Miniapp docs](https://miniapps.farcaster.xyz/docs)
- Test with provided debug endpoints
- Review browser console logs