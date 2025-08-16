#!/usr/bin/env node

/**
 * Test the LoanCast parser with Solienne's casts
 */

const { parseLoanCast } = require('./loancast-parser');

// Solienne's test casts
const testCasts = [
  {
    text: '/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"',
    fid: 1113468,
    expected: { valid: true, amount: 50, days: 7 }
  },
  {
    text: '/loancast borrow 25 for 5d @ 2%/mo — "Film scans + shipping"',
    fid: 1113468,
    expected: { valid: true, amount: 25, days: 5 }
  },
  {
    text: '/loancast borrow 100 for 14d @ 2%/mo — "Paris Photo materials"',
    fid: 1113468,
    expected: { valid: true, amount: 100, days: 14 }
  },
  {
    text: '/loancast borrow 150 for 7d @ 2%/mo — "Too much money"',
    fid: 1113468,
    expected: { valid: false, reason: 'Over 100 USDC limit' }
  },
  {
    text: '/loancast borrow 50 for 45d @ 2%/mo — "Too many days"',
    fid: 1113468,
    expected: { valid: false, reason: 'Over 30 day limit' }
  },
  {
    text: 'loancast borrow 50 for 7d @ 2%/mo — "Missing slash"',
    fid: 1113468,
    expected: { valid: false, reason: 'Invalid syntax' }
  }
];

console.log('═══════════════════════════════════════════');
console.log('    TESTING LOANCAST PARSER');
console.log('═══════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

testCasts.forEach((test, i) => {
  console.log(`Test ${i + 1}: "${test.text.substring(0, 50)}..."`);
  
  const result = parseLoanCast(test.text);
  
  if (test.expected.valid && result.valid) {
    if (result.data.amount === test.expected.amount && 
        result.data.days === test.expected.days) {
      console.log('✅ PASS');
      console.log(`   Amount: ${result.data.amount} USDC`);
      console.log(`   Days: ${result.data.days}`);
      console.log(`   Interest: ${result.data.interest} USDC`);
      console.log(`   Total: ${result.data.repayAmount} USDC`);
      passed++;
    } else {
      console.log('❌ FAIL - Wrong values');
      failed++;
    }
  } else if (!test.expected.valid && !result.valid) {
    console.log('✅ PASS - Correctly rejected');
    console.log(`   Error: ${result.error}`);
    passed++;
  } else {
    console.log('❌ FAIL');
    console.log(`   Expected: ${test.expected.valid ? 'valid' : 'invalid'}`);
    console.log(`   Got: ${result.valid ? 'valid' : 'invalid'}`);
    failed++;
  }
  
  console.log('');
});

console.log('═══════════════════════════════════════════');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════\n');

// Show example API call
console.log('Example API call to create loan from cast:\n');
console.log('```bash');
console.log('curl -X POST https://loancast.app/api/loancast/parse \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{');
console.log('    "text": "/loancast borrow 50 for 7d @ 2%/mo — \\"Working capital for print run\\"",');
console.log('    "fid": 1113468');
console.log('  }\'');
console.log('```');

process.exit(failed > 0 ? 1 : 0);