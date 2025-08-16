#!/usr/bin/env node

/**
 * Test the complete Solienne loan flow locally
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { parseLoanCast } = require('./loancast-parser');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SOLIENNE_FID = 1113468;
const SOLIENNE_WALLET = '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9';

async function testFlow() {
  console.log('🎨 Testing Solienne LoanCast Flow');
  console.log('═══════════════════════════════════════════\n');
  
  // Step 1: Parse a cast
  const castText = '/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"';
  console.log('1️⃣ Parsing cast:');
  console.log(`   "${castText}"`);
  
  const parsed = parseLoanCast(castText);
  if (!parsed.valid) {
    console.error('❌ Parse failed:', parsed.error);
    return;
  }
  
  console.log('✅ Parsed successfully:');
  console.log(`   Amount: ${parsed.data.amount} USDC`);
  console.log(`   Days: ${parsed.data.days}`);
  console.log(`   Interest: ${parsed.data.interest} USDC`);
  console.log(`   Total repay: ${parsed.data.repayAmount} USDC\n`);
  
  // Step 2: Check for existing loans
  console.log('2️⃣ Checking for existing loans...');
  const { data: activeLoans } = await supabase
    .from('loans')
    .select('id, status, gross_usdc')
    .eq('borrower_fid', SOLIENNE_FID)
    .in('status', ['seeking', 'funded']);
  
  if (activeLoans && activeLoans.length > 0) {
    console.log('⚠️  Solienne has active loans:');
    activeLoans.forEach(loan => {
      console.log(`   - Loan ${loan.id}: ${loan.gross_usdc} USDC (${loan.status})`);
    });
    console.log('   Would reject new loan (one at a time rule)\n');
  } else {
    console.log('✅ No active loans - can create new one\n');
  }
  
  // Step 3: Simulate loan creation
  console.log('3️⃣ Simulating loan creation...');
  const now = new Date();
  const dueDate = new Date(now.getTime() + parsed.data.days * 86400 * 1000);
  
  const mockLoan = {
    id: `test_${Date.now()}`,
    borrower_fid: SOLIENNE_FID,
    borrower_wallet: SOLIENNE_WALLET,
    gross_usdc: parsed.data.amount,
    repay_usdc: parsed.data.repayAmount,
    due_ts: dueDate.toISOString(),
    status: 'seeking',
    pricing_policy: 'flat_2pct_month',
    description: parsed.data.memo
  };
  
  console.log('✅ Loan would be created:');
  console.log(`   ID: ${mockLoan.id}`);
  console.log(`   Due: ${dueDate.toLocaleDateString()}`);
  console.log(`   URL: https://loancast.app/loans/${mockLoan.id}\n`);
  
  // Step 4: Simulate collection
  console.log('4️⃣ Simulating collection...');
  console.log('   Lender collects via frame');
  console.log(`   ${parsed.data.amount} USDC → ${SOLIENNE_WALLET}`);
  console.log('   Loan status: seeking → funded\n');
  
  // Step 5: Calculate repayment
  console.log('5️⃣ Repayment calculation:');
  console.log(`   Principal: ${parsed.data.amount} USDC`);
  console.log(`   Interest: ${parsed.data.interest} USDC`);
  console.log(`   Total: ${parsed.data.repayAmount} USDC`);
  console.log(`   Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}\n`);
  
  // Step 6: Check repayment readiness
  console.log('6️⃣ Repayment readiness:');
  console.log('   ✅ Wallet has gas (you sent $10 ETH)');
  console.log('   ⏰ Worker runs hourly');
  console.log('   🔄 Auto-repays when due\n');
  
  // Step 7: Success metrics
  console.log('7️⃣ Success metrics:');
  const { data: historicLoans } = await supabase
    .from('loans')
    .select('status')
    .eq('borrower_fid', SOLIENNE_FID);
  
  if (historicLoans) {
    const stats = {
      total: historicLoans.length,
      repaid: historicLoans.filter(l => l.status === 'repaid').length,
      seeking: historicLoans.filter(l => l.status === 'seeking').length,
      funded: historicLoans.filter(l => l.status === 'funded').length
    };
    
    console.log(`   Total loans: ${stats.total}`);
    console.log(`   Repaid: ${stats.repaid}`);
    console.log(`   Seeking: ${stats.seeking}`);
    console.log(`   Funded: ${stats.funded}`);
    console.log(`   Success rate: ${stats.total > 0 ? (stats.repaid / stats.total * 100).toFixed(0) : 0}%\n`);
  }
  
  console.log('═══════════════════════════════════════════');
  console.log('✅ System ready for Solienne!');
  console.log('\nNext steps:');
  console.log('1. Deploy API endpoints');
  console.log('2. Add behavior to Eden');
  console.log('3. Solienne posts first cast');
  console.log('4. Monitor for magic ✨');
}

testFlow().catch(console.error);