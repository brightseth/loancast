#!/usr/bin/env node

/**
 * Pre-launch verification for Solienne's historic first loan
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { parseLoanCast } = require('./loancast-parser');
const { ethers } = require('ethers');

const SOLIENNE_FID = 1113468;
const SOLIENNE_WALLET = '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function preFlightCheck() {
  console.log('🚀 SOLIENNE PRE-LAUNCH VERIFICATION');
  console.log('═══════════════════════════════════════════\n');
  
  const checks = {
    environment: true,
    database: true,
    parser: true,
    wallet: true,
    agent: true
  };
  
  // 1. Environment Check
  console.log('1️⃣ Environment Variables:');
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'BASE_RPC_URL'
  ];
  
  for (const env of requiredEnvs) {
    if (process.env[env]) {
      console.log(`   ✅ ${env} is set`);
    } else {
      console.log(`   ❌ ${env} is missing`);
      checks.environment = false;
    }
  }
  
  if (process.env.SOLIENNE_PRIVATE_KEY) {
    console.log('   ✅ SOLIENNE_PRIVATE_KEY is set');
  } else {
    console.log('   ⚠️  SOLIENNE_PRIVATE_KEY not set (needed for production)');
  }
  console.log('');
  
  // 2. Database Check
  console.log('2️⃣ Database Connection:');
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Connected to Supabase');
    
    // Check for agent tables
    const { data: agentCheck } = await supabase
      .from('agents')
      .select('agent_fid')
      .eq('agent_fid', SOLIENNE_FID)
      .single();
    
    if (agentCheck) {
      console.log('   ✅ Agent tables exist');
      console.log(`   ✅ Solienne registered (FID: ${SOLIENNE_FID})`);
    } else {
      console.log('   ⚠️  Solienne not found in agents table');
      checks.database = false;
    }
  } catch (error) {
    console.log('   ❌ Database error:', error.message);
    checks.database = false;
  }
  console.log('');
  
  // 3. Parser Check
  console.log('3️⃣ LoanCast Parser:');
  const testCast = '/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"';
  const parsed = parseLoanCast(testCast);
  
  if (parsed.valid) {
    console.log('   ✅ Parser working correctly');
    console.log(`   ✅ Test: 50 USDC for 7 days = ${parsed.data.repayAmount} USDC repayment`);
  } else {
    console.log('   ❌ Parser failed');
    checks.parser = false;
  }
  console.log('');
  
  // 4. Wallet Check
  console.log('4️⃣ Solienne Wallet Status:');
  console.log(`   Address: ${SOLIENNE_WALLET}`);
  
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );
    
    // Check ETH balance
    const ethBalance = await provider.getBalance(SOLIENNE_WALLET);
    const ethFormatted = parseFloat(ethers.formatEther(ethBalance));
    
    if (ethFormatted >= 0.001) {
      console.log(`   ✅ ETH Balance: ${ethFormatted.toFixed(6)} ETH (sufficient for gas)`);
    } else {
      console.log(`   ❌ ETH Balance: ${ethFormatted.toFixed(6)} ETH (needs more gas)`);
      checks.wallet = false;
    }
    
    // Check USDC balance
    const usdcAbi = ['function balanceOf(address) view returns (uint256)'];
    const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);
    const usdcBalance = await usdc.balanceOf(SOLIENNE_WALLET);
    const usdcFormatted = ethers.formatUnits(usdcBalance, 6);
    
    console.log(`   ℹ️  USDC Balance: ${usdcFormatted} USDC`);
    
  } catch (error) {
    console.log('   ⚠️  Could not check on-chain balances');
  }
  console.log('');
  
  // 5. Active Loans Check
  console.log('5️⃣ Active Loan Check:');
  try {
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('id, status')
      .eq('borrower_fid', SOLIENNE_FID)
      .in('status', ['seeking', 'funded']);
    
    if (activeLoans && activeLoans.length > 0) {
      console.log(`   ⚠️  Solienne has ${activeLoans.length} active loan(s)`);
      console.log('   ⚠️  Must complete before new loan');
      checks.agent = false;
    } else {
      console.log('   ✅ No active loans - ready to borrow');
    }
  } catch (error) {
    console.log('   ❌ Could not check active loans');
    checks.agent = false;
  }
  console.log('');
  
  // 6. API Endpoints
  console.log('6️⃣ API Endpoint Files:');
  const fs = require('fs');
  
  const endpoints = [
    'app/api/loancast/parse/route.ts',
    'app/api/loancast/collect/route.ts',
    'app/api/cron/solienne-repay/route.ts'
  ];
  
  for (const endpoint of endpoints) {
    const fullPath = path.join(__dirname, '../../', endpoint);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${endpoint}`);
    } else {
      console.log(`   ❌ ${endpoint} missing`);
    }
  }
  console.log('');
  
  // Final Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 READINESS SUMMARY:\n');
  
  const allGood = Object.values(checks).every(v => v);
  
  if (allGood) {
    console.log('✅ ALL SYSTEMS GO!');
    console.log('\nNext steps:');
    console.log('1. Deploy code: git push origin main');
    console.log('2. Add SOLIENNE_PRIVATE_KEY to Vercel');
    console.log('3. Configure Eden with behavior blocks');
    console.log('4. Post first cast as Solienne');
    console.log('5. Fund the loan');
    console.log('6. Make history! 🚀');
  } else {
    console.log('⚠️  Some issues need attention:');
    
    if (!checks.environment) {
      console.log('- Set missing environment variables');
    }
    if (!checks.database) {
      console.log('- Fix database connection or register Solienne');
    }
    if (!checks.parser) {
      console.log('- Debug parser issue');
    }
    if (!checks.wallet) {
      console.log('- Add more ETH for gas');
    }
    if (!checks.agent) {
      console.log('- Complete or cancel active loans');
    }
  }
  
  console.log('\n🎨 Solienne is ready to make history!');
}

preFlightCheck().catch(console.error);