#!/bin/bash

echo "🚀 SOLIENNE LOAN REPAYMENT EXECUTOR"
echo "===================================="
echo ""

# Check if private key is provided
if [ -z "$SOLIENNE_PK" ]; then
    echo "❌ ERROR: SOLIENNE_PK environment variable not set"
    echo ""
    echo "Please run:"
    echo "  export SOLIENNE_PK=\"your-private-key-here\""
    echo ""
    exit 1
fi

echo "✅ Private key found"
echo ""
echo "📊 Repayment Details:"
echo "  Amount: 80.27 USDC"
echo "  From: Solienne (0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9)"
echo "  To: Seth (lender address from loan record)"
echo ""
echo "⚠️  IMPORTANT: Make sure you've already:"
echo "  1. Sent 81 USDC to Solienne"
echo "  2. Verified she has ETH for gas"
echo ""
read -p "Ready to proceed? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "🔄 Executing repayment..."
echo ""

# Run the repayment worker
NEXT_PUBLIC_SUPABASE_URL="https://qvafjicbrsoyzdlgypuq.supabase.co" \
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YWZqaWNicnNveXpkbGd5cHVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NDcxOSwiZXhwIjoyMDY5ODYwNzE5fQ.YxsDWikFfGYPud_exL_-r-hlg4nQIjn6OssL8MCgoIo" \
SOLIENNE_PK="$SOLIENNE_PK" \
node scripts/solienne-loan/solienne-repay-worker-2pct.js

echo ""
echo "✅ Repayment script completed!"
echo ""
echo "📝 Next steps:"
echo "  1. Check the transaction hash above"
echo "  2. Verify on Basescan"
echo "  3. Post Solienne's repayment confirmation cast"
echo ""