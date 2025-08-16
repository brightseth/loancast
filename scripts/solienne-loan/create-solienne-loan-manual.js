#!/usr/bin/env node

/**
 * Manually create Solienne's loan from her cast
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createSolienneLoan() {
  console.log('🎨 Creating Solienne\'s Historic First Loan\n');
  
  // Her exact parameters
  const amount = 80;
  const days = 5;
  const memo = "Archival prints for collector portfolio";
  const MONTHLY_RATE = 0.02;
  const SOLIENNE_FID = 1113468;
  const SOLIENNE_WALLET = '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9';
  
  // Calculate repayment
  const interest = amount * MONTHLY_RATE * (days / 30);
  const repayAmount = Math.round((amount + interest) * 100) / 100;
  
  console.log('Loan Details:');
  console.log(`  Amount: ${amount} USDC`);
  console.log(`  Duration: ${days} days`);
  console.log(`  Interest: ${interest.toFixed(2)} USDC`);
  console.log(`  Total Repay: ${repayAmount} USDC`);
  console.log(`  Purpose: "${memo}"`);
  console.log('');
  
  // Check for existing loans first
  const { data: existing } = await supabase
    .from('loans')
    .select('id')
    .eq('borrower_fid', SOLIENNE_FID)
    .in('status', ['seeking', 'funded']);
  
  if (existing && existing.length > 0) {
    console.log('⚠️  Solienne already has an active loan');
    return;
  }
  
  // Create the loan
  const loanId = crypto.randomUUID();
  const now = new Date();
  const dueDate = new Date(now.getTime() + days * 86400 * 1000);
  
  const loan = {
    id: loanId,
    cast_hash: `solienne_historic_${Date.now()}`,
    borrower_fid: SOLIENNE_FID,
    borrower_type: 'agent',
    gross_usdc: amount,
    net_usdc: amount,
    yield_bps: 0,
    repay_usdc: repayAmount,
    start_ts: now.toISOString(),
    due_ts: dueDate.toISOString(),
    status: 'seeking',
    loan_number: 400001, // Historic first agent loan
    description: memo,
    requested_usdc: amount
  };
  
  const { data, error } = await supabase
    .from('loans')
    .insert(loan)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to create loan:', error);
    return;
  }
  
  console.log('✅ HISTORIC LOAN CREATED!\n');
  console.log('🎨 Solienne\'s First Loan:');
  console.log(`   ID: ${data.id}`);
  console.log(`   Status: ${data.status}`);
  console.log(`   View at: https://loancast.app/loans/${data.id}`);
  console.log('');
  console.log('📝 What She Demonstrated:');
  console.log('   ✅ Chose unique amount (80, not 50)');
  console.log('   ✅ Selected appropriate duration (5 days, not 7)');
  console.log('   ✅ Created original memo (not our example)');
  console.log('   ✅ Showed genuine economic reasoning');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('   1. Go to https://loancast.app/explore');
  console.log('   2. Find Solienne\'s loan (80 USDC)');
  console.log('   3. Click "Fund" to make history');
  console.log('');
  console.log('This is the first AI agent loan request in history!');
}

createSolienneLoan().catch(console.error);