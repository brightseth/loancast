#!/bin/bash

# Quick test script for agent lending
# Run with: bash scripts/quick-test-agents.sh

set -e

echo "🚀 Quick Agent Lending Test"
echo "============================"

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
HUMAN_FID="${HUMAN_FID:-12345}"
AGENT1_FID="${AGENT1_FID:-999001}"
AGENT2_FID="${AGENT2_FID:-999002}"

echo "Config:"
echo "  BASE_URL: $BASE_URL"
echo "  HUMAN_FID: $HUMAN_FID"
echo "  AGENT1_FID: $AGENT1_FID"
echo "  AGENT2_FID: $AGENT2_FID"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Register Agent 1 (Borrower)
echo -e "${YELLOW}1. Registering Agent 1 as borrower...${NC}"
AGENT1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/agents/auth" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_fid": '$AGENT1_FID',
    "controller_fid": '$HUMAN_FID',
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd1",
    "agent_type": "yield",
    "strategy": {
      "riskTolerance": "moderate",
      "maxLoanAmount": 100,
      "minCreditScore": 0,
      "preferredDuration": [7, 14, 30]
    },
    "policy": {
      "daily_usdc_cap": 1000,
      "per_tx_cap": 100,
      "allow_autofund": true
    }
  }')

AGENT1_TOKEN=$(echo $AGENT1_RESPONSE | jq -r '.session_token')
if [ "$AGENT1_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Agent 1 registered${NC}"
else
  echo -e "${RED}✗ Failed to register Agent 1${NC}"
  echo $AGENT1_RESPONSE
  exit 1
fi

# 2. Register Agent 2 (Lender)
echo -e "${YELLOW}2. Registering Agent 2 as lender...${NC}"
AGENT2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/agents/auth" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_fid": '$AGENT2_FID',
    "controller_fid": '$HUMAN_FID',
    "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEd2",
    "agent_type": "lp",
    "strategy": {
      "riskTolerance": "aggressive",
      "maxLoanAmount": 200,
      "minCreditScore": 0,
      "preferredDuration": [7, 14, 30]
    },
    "policy": {
      "daily_usdc_cap": 2000,
      "per_tx_cap": 200,
      "allow_autofund": true
    }
  }')

AGENT2_TOKEN=$(echo $AGENT2_RESPONSE | jq -r '.session_token')
if [ "$AGENT2_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Agent 2 registered${NC}"
else
  echo -e "${RED}✗ Failed to register Agent 2${NC}"
  echo $AGENT2_RESPONSE
  exit 1
fi

# 3. Check agent performance
echo -e "${YELLOW}3. Checking agent performance...${NC}"
curl -s "$BASE_URL/api/agents/$AGENT1_FID/performance" | jq '.'
curl -s "$BASE_URL/api/agents/$AGENT2_FID/performance" | jq '.'

# 4. Check available loans
echo -e "${YELLOW}4. Checking available loans...${NC}"
AVAILABLE=$(curl -s "$BASE_URL/api/loans/available")
echo "Available loans: $(echo $AVAILABLE | jq '. | length')"

# 5. Try to fund a loan (if any available)
FIRST_LOAN=$(echo $AVAILABLE | jq -r '.[0].id')
if [ "$FIRST_LOAN" != "null" ] && [ "$FIRST_LOAN" != "" ]; then
  echo -e "${YELLOW}5. Agent 2 attempting to fund loan $FIRST_LOAN...${NC}"
  
  FUND_RESPONSE=$(curl -s -X POST "$BASE_URL/api/loans/$FIRST_LOAN/auto-fund" \
    -H "Content-Type: application/json" \
    -d '{
      "session_token": "'$AGENT2_TOKEN'",
      "agent_fid": '$AGENT2_FID'
    }')
  
  if [ "$(echo $FUND_RESPONSE | jq -r '.ok')" = "true" ]; then
    echo -e "${GREEN}✓ Loan funded successfully!${NC}"
  else
    echo -e "${YELLOW}⚠ Funding rejected (expected during holdback):${NC}"
    echo $FUND_RESPONSE | jq -r '.reasons[]'
  fi
else
  echo -e "${YELLOW}No loans available to fund${NC}"
fi

# 6. Summary
echo ""
echo -e "${GREEN}Test Summary:${NC}"
echo "- Agent 1 (Borrower): Registered as FID $AGENT1_FID"
echo "- Agent 2 (Lender): Registered as FID $AGENT2_FID"
echo "- Both agents are ready to participate in the marketplace"
echo ""
echo "Next steps:"
echo "1. Create a loan request (as human or agent)"
echo "2. Wait 15 minutes for holdback window"
echo "3. Agents will auto-fund based on their policies"
echo ""
echo "To monitor agent activity:"
echo "  curl $BASE_URL/api/agents/$AGENT1_FID/performance"
echo "  curl $BASE_URL/api/agents/$AGENT2_FID/performance"