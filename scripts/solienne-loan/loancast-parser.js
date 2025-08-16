#!/usr/bin/env node

/**
 * LoanCast Parser for Solienne's Cast Syntax
 * Parses: /loancast borrow <amount> for <days>d @ 2%/mo — "<memo>"
 */

const LOANCAST_REGEX = /^\/loancast\s+borrow\s+([0-9]+(?:\.[0-9]{1,2})?)\s+for\s+([0-9]{1,2})d\s+@\s*2%\/mo\s+—\s*"([^"]+)"$/;

const MAX_AMOUNT = 100;
const MAX_DAYS = 30;
const MONTHLY_RATE = 0.02;

function parseLoanCast(text) {
  const match = text.match(LOANCAST_REGEX);
  
  if (!match) {
    return {
      valid: false,
      error: 'Invalid format. Use: /loancast borrow 50 for 7d @ 2%/mo — "purpose"'
    };
  }
  
  const amount = parseFloat(match[1]);
  const days = parseInt(match[2]);
  const memo = match[3];
  
  // Validate amount
  if (amount <= 0 || amount > MAX_AMOUNT) {
    return {
      valid: false,
      error: `Amount must be between 0.01 and ${MAX_AMOUNT} USDC`
    };
  }
  
  // Validate days
  if (days < 1 || days > MAX_DAYS) {
    return {
      valid: false,
      error: `Duration must be between 1 and ${MAX_DAYS} days`
    };
  }
  
  // Validate memo
  if (memo.length > 80) {
    return {
      valid: false,
      error: 'Memo must be 80 characters or less'
    };
  }
  
  // Calculate repayment
  const interest = amount * MONTHLY_RATE * (days / 30);
  const repayAmount = amount + interest;
  
  return {
    valid: true,
    data: {
      amount: amount,
      days: days,
      memo: memo,
      interest: Math.round(interest * 100) / 100,
      repayAmount: Math.round(repayAmount * 100) / 100,
      rate: '2%/mo',
      borrower_fid: 1113468,
      borrower_type: 'agent',
      pricing_policy: 'flat_2pct_month'
    }
  };
}

// Test examples
function testParser() {
  const examples = [
    '/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"',
    '/loancast borrow 25 for 5d @ 2%/mo — "Film scans + shipping"',
    '/loancast borrow 100 for 14d @ 2%/mo — "Paris Photo materials"',
    '/loancast borrow 40 for 3d @ 2%/mo — "Prototype test"',
    '/loancast borrow 60 for 10d @ 2%/mo — "Edition framing deposit"',
    // Invalid examples
    '/loancast borrow 150 for 7d @ 2%/mo — "Too much"', // Over limit
    '/loancast borrow 50 for 45d @ 2%/mo — "Too long"', // Over 30 days
    '/loancast borrow 50 for 7d @ 3%/mo — "Wrong rate"', // Wrong rate
    'loancast borrow 50 for 7d @ 2%/mo — "Missing slash"', // Missing /
  ];
  
  console.log('Testing LoanCast Parser:\n');
  
  examples.forEach(example => {
    console.log(`Input: ${example}`);
    const result = parseLoanCast(example);
    
    if (result.valid) {
      console.log('✅ Valid');
      console.log(`   Amount: ${result.data.amount} USDC`);
      console.log(`   Days: ${result.data.days}`);
      console.log(`   Interest: ${result.data.interest} USDC`);
      console.log(`   Total repay: ${result.data.repayAmount} USDC`);
      console.log(`   Memo: "${result.data.memo}"`);
    } else {
      console.log(`❌ Invalid: ${result.error}`);
    }
    console.log('');
  });
}

// Export for use in API
module.exports = { parseLoanCast, LOANCAST_REGEX };

// Run tests if called directly
if (require.main === module) {
  testParser();
}