#!/bin/bash

# Deploy Solienne repayment worker
# This script sets up the cron job for autonomous repayment

echo "🚀 Deploying Solienne Repayment Worker"
echo "======================================="

# Check if we have required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Missing environment variables"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set"
    exit 1
fi

# Test worker locally first
echo "📝 Testing worker locally..."
node scripts/solienne-loan/solienne-repay-worker-2pct.js --test

if [ $? -ne 0 ]; then
    echo "❌ Worker test failed"
    exit 1
fi

echo "✅ Worker test passed"

# Create systemd service for production (Linux servers)
# Or set up as Vercel cron/GitHub Action
echo ""
echo "📋 Deployment Options:"
echo ""
echo "1. Vercel Cron (Recommended):"
echo "   Add to vercel.json:"
echo '   {
     "crons": [{
       "path": "/api/cron/solienne-repay",
       "schedule": "0 * * * *"
     }]
   }'
echo ""
echo "2. GitHub Actions:"
echo "   Create .github/workflows/solienne-repay.yml"
echo ""
echo "3. Manual cron (server):"
echo "   Add to crontab:"
echo "   0 * * * * cd /path/to/loancast && node scripts/solienne-loan/solienne-repay-worker-2pct.js"
echo ""
echo "4. Process manager (PM2):"
echo "   pm2 start scripts/solienne-loan/solienne-repay-worker-2pct.js --name solienne-repay --cron '0 * * * *'"
echo ""

echo "✅ Deployment instructions ready!"
echo ""
echo "Next steps:"
echo "1. Choose deployment method above"
echo "2. Deploy API endpoints to production"
echo "3. Have Solienne post first cast"
echo "4. Monitor for collections and repayments"