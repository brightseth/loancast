#!/bin/bash
# Simple LoanCast monitoring script

echo "🔍 LoanCast Live Monitor"
echo "======================="

# Basic health check
echo "📊 System Status:"
curl -s -I https://loancast.app | grep "HTTP/" | head -1

# Count total loans
LOAN_COUNT=$(curl -s https://loancast.app/api/loans | jq 'length' 2>/dev/null || echo "API error")
echo "💰 Total loans: $LOAN_COUNT"

# Check recent loan statuses
echo ""
echo "📝 Recent Loans:"
curl -s https://loancast.app/api/loans | jq -r '.[0:3] | .[] | "\(.status) | $\(.gross_usdc) | FID \(.borrower_fid) → \(.lender_fid)"' 2>/dev/null || echo "Could not fetch loan details"

# Henry's specific loan
echo ""
echo "🎯 Henry's Loan (due Sept 6):"
curl -s https://loancast.app/api/loans/9abed685-639c-44ce-b811-c83e897d94dd | jq -r '"\(.status) | $\(.gross_usdc) → $\(.repay_usdc) due \(.due_ts | split("T")[0])"' 2>/dev/null || echo "Could not fetch Henry's loan"

echo ""
echo "⏰ Checked at: $(date)"