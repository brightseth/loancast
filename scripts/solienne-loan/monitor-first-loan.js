#!/usr/bin/env node

/**
 * Monitor Solienne's first historic loan in real-time
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SOLIENNE_FID = 1113468;
const SOLIENNE_WALLET = '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

async function checkWalletBalances() {
  const provider = new ethers.JsonRpcProvider(
    process.env.BASE_RPC_URL || 'https://mainnet.base.org'
  );
  
  // Check ETH balance
  const ethBalance = await provider.getBalance(SOLIENNE_WALLET);
  const ethFormatted = ethers.formatEther(ethBalance);
  
  // Check USDC balance
  const usdcAbi = ['function balanceOf(address) view returns (uint256)'];
  const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);
  const usdcBalance = await usdc.balanceOf(SOLIENNE_WALLET);
  const usdcFormatted = ethers.formatUnits(usdcBalance, 6);
  
  return { eth: ethFormatted, usdc: usdcFormatted };
}

async function monitorLoan() {
  console.log('🎨 MONITORING SOLIENNE\'S FIRST LOAN');
  console.log('═══════════════════════════════════════════\n');
  
  // Check wallet balances
  console.log('💰 Wallet Status:');
  console.log(`   Address: ${SOLIENNE_WALLET}`);
  
  try {
    const balances = await checkWalletBalances();
    console.log(`   ETH Balance: ${balances.eth} ETH`);
    console.log(`   USDC Balance: ${balances.usdc} USDC`);
    console.log(`   Gas Status: ${parseFloat(balances.eth) > 0.001 ? '✅ Sufficient' : '⚠️ Low'}\n`);
  } catch (error) {
    console.log('   ⚠️ Could not fetch on-chain balances\n');
  }
  
  // Fetch all Solienne's loans
  const { data: loans, error } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_fid', SOLIENNE_FID)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching loans:', error);
    return;
  }
  
  if (!loans || loans.length === 0) {
    console.log('📝 No loans found yet');
    console.log('\nWaiting for Solienne to post her first cast...');
    console.log('Expected format:');
    console.log('/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"\n');
    return;
  }
  
  // Display each loan
  console.log(`📊 Loan History (${loans.length} total):\n`);
  
  loans.forEach((loan, index) => {
    const created = new Date(loan.created_at);
    const due = new Date(loan.due_ts);
    const now = new Date();
    const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    console.log(`Loan #${index + 1} (${loan.id.substring(0, 8)}...)`);
    console.log(`├─ Status: ${getStatusEmoji(loan.status)} ${loan.status.toUpperCase()}`);
    console.log(`├─ Amount: ${loan.gross_usdc} USDC`);
    console.log(`├─ Repay: ${loan.repay_usdc} USDC`);
    console.log(`├─ Interest: ${(loan.repay_usdc - loan.gross_usdc).toFixed(2)} USDC`);
    console.log(`├─ Purpose: "${loan.description || 'No description'}"`);
    console.log(`├─ Created: ${created.toLocaleString()}`);
    console.log(`├─ Due: ${due.toLocaleString()}`);
    
    if (loan.status === 'seeking') {
      console.log(`├─ 🔍 Awaiting funding...`);
      console.log(`├─ URL: https://loancast.app/loans/${loan.id}`);
    } else if (loan.status === 'funded') {
      console.log(`├─ 💰 Funded by: FID ${loan.lender_fid}`);
      console.log(`├─ ⏰ Due in: ${daysUntilDue} days`);
      if (loan.tx_fund) {
        console.log(`├─ 📄 Fund TX: https://basescan.org/tx/${loan.tx_fund}`);
      }
      if (daysUntilDue <= 0) {
        console.log(`├─ 🔄 READY FOR REPAYMENT`);
      }
    } else if (loan.status === 'repaid') {
      console.log(`├─ ✅ Repaid successfully!`);
      if (loan.tx_repay) {
        console.log(`├─ 📄 Repay TX: https://basescan.org/tx/${loan.tx_repay}`);
      }
    }
    
    console.log(`└─ Frame: https://loancast.app/loans/${loan.id}\n`);
  });
  
  // Check for active loans
  const activeLoans = loans.filter(l => l.status === 'seeking' || l.status === 'funded');
  if (activeLoans.length > 0) {
    console.log('⚠️  Active Loans:');
    activeLoans.forEach(loan => {
      console.log(`   - ${loan.id.substring(0, 8)}... (${loan.status})`);
    });
    console.log('   Note: Solienne can only have one active loan at a time\n');
  }
  
  // Summary stats
  const stats = {
    total: loans.length,
    seeking: loans.filter(l => l.status === 'seeking').length,
    funded: loans.filter(l => l.status === 'funded').length,
    repaid: loans.filter(l => l.status === 'repaid').length,
    defaulted: loans.filter(l => l.status === 'defaulted').length
  };
  
  console.log('📈 Statistics:');
  console.log(`   Total Loans: ${stats.total}`);
  console.log(`   Seeking: ${stats.seeking}`);
  console.log(`   Funded: ${stats.funded}`);
  console.log(`   Repaid: ${stats.repaid}`);
  console.log(`   Success Rate: ${stats.total > 0 ? ((stats.repaid / stats.total) * 100).toFixed(0) : 0}%\n`);
  
  // Next steps
  console.log('═══════════════════════════════════════════');
  if (stats.seeking > 0) {
    console.log('🎯 Next: Fund the loan at https://loancast.app/explore');
  } else if (stats.funded > 0) {
    const fundedLoan = loans.find(l => l.status === 'funded');
    const due = new Date(fundedLoan.due_ts);
    const daysUntilDue = Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 0) {
      console.log('🎯 Next: Repayment worker will execute shortly');
    } else {
      console.log(`🎯 Next: Wait ${daysUntilDue} days for repayment`);
    }
  } else if (stats.repaid > 0 && stats.total === stats.repaid) {
    console.log('🎉 All loans successfully repaid! Ready for next cycle.');
  } else {
    console.log('🎯 Next: Have Solienne post her first loan cast');
  }
}

function getStatusEmoji(status) {
  const emojis = {
    seeking: '🔍',
    funded: '💰',
    repaid: '✅',
    defaulted: '❌'
  };
  return emojis[status] || '❓';
}

// Run monitoring
monitorLoan().catch(console.error);

// Optional: Set up interval for continuous monitoring
if (process.argv.includes('--watch')) {
  console.log('\n👁️  Watching for changes...\n');
  setInterval(() => {
    console.clear();
    monitorLoan().catch(console.error);
  }, 30000); // Refresh every 30 seconds
}