const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkRepaymentAmount() {
  const { data: loan, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', '0fd92bda-5b08-48b0-84f8-403c10d2929a')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  // The gross_usdc is what Solienne received (72 USDC)
  // But she needs to repay the original amount (80 USDC) + interest
  const amountReceived = parseFloat(loan.gross_usdc);
  const originalAmount = 80; // The actual loan amount before platform fees
  const termDays = loan.term_days || 5;
  const ratePct = loan.rate_pct || 2;
  
  // Calculate interest on the original amount: 80 * (2/100) * (5/30)
  const interest = originalAmount * (ratePct / 100) * (termDays / 30);
  const totalRepayment = originalAmount + interest;
  
  console.log('💰 Solienne\'s Loan Repayment Details:');
  console.log('=====================================');
  console.log(`Original Loan Amount: ${originalAmount} USDC`);
  console.log(`Amount Received (after platform fee): ${amountReceived} USDC`);
  console.log(`Term: ${termDays} days`);
  console.log(`Rate: ${ratePct}% per month`);
  console.log(`Interest: ${interest.toFixed(4)} USDC`);
  console.log(`\n📊 TOTAL REPAYMENT: ${totalRepayment.toFixed(2)} USDC`);
  console.log('\nWallet: 0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9');
}

checkRepaymentAmount();