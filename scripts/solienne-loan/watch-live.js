#!/usr/bin/env node

/**
 * Live monitoring for Solienne's 1:30 AM cast
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SOLIENNE_FID = 1113468;

async function watchForCast() {
  const startTime = new Date();
  console.log(`\n🎨 WATCHING FOR SOLIENNE'S CAST`);
  console.log(`Started: ${startTime.toLocaleTimeString()}`);
  console.log(`Expected: 1:30 AM`);
  console.log('═══════════════════════════════════════════\n');
  
  let lastCheckCount = 0;
  
  const checkInterval = setInterval(async () => {
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);
    
    // Check for new loans
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('borrower_fid', SOLIENNE_FID)
      .order('created_at', { ascending: false });
    
    if (loans && loans.length > lastCheckCount) {
      console.log('\n🚨 NEW LOAN DETECTED!');
      const newLoan = loans[0];
      console.log(`\n✅ SOLIENNE POSTED HER LOAN REQUEST!`);
      console.log(`   ID: ${newLoan.id}`);
      console.log(`   Amount: ${newLoan.gross_usdc} USDC`);
      console.log(`   Days: ${Math.round((new Date(newLoan.due_ts) - new Date(newLoan.start_ts)) / 86400000)}`);
      console.log(`   Memo: "${newLoan.description}"`);
      console.log(`   Interest: ${(newLoan.repay_usdc - newLoan.gross_usdc).toFixed(2)} USDC`);
      console.log(`   Total Repay: ${newLoan.repay_usdc} USDC`);
      console.log(`   Status: ${newLoan.status}`);
      console.log(`\n🔗 View at: https://loancast.app/loans/${newLoan.id}`);
      console.log('\n🎯 NEXT STEP: Fund the loan at https://loancast.app/explore');
      
      // Show if she made real decisions or copied examples
      if (newLoan.gross_usdc === 50 && newLoan.description === "Working capital for print run") {
        console.log('\n⚠️  Note: She used example values');
      } else {
        console.log('\n✨ AGENCY DEMONSTRATED: Original values chosen!');
        console.log(`   She chose ${newLoan.gross_usdc} USDC (not 50)`);
        console.log(`   She wrote: "${newLoan.description}"`);
      }
      
      clearInterval(checkInterval);
      console.log('\n🏁 Monitoring complete. Historic moment captured!');
      return;
    }
    
    // Status update every 10 seconds
    if (elapsed % 10 === 0) {
      process.stdout.write(`\r⏰ Waiting... [${elapsed}s elapsed] Current time: ${now.toLocaleTimeString()}`);
    }
    
    lastCheckCount = loans ? loans.length : 0;
    
    // Timeout after 10 minutes
    if (elapsed > 600) {
      console.log('\n\n⏱️ Timeout after 10 minutes');
      console.log('Check if she posted fallback text in Eden instead');
      clearInterval(checkInterval);
    }
  }, 1000);
}

console.log('═══════════════════════════════════════════');
console.log('   🎨 SOLIENNE HISTORIC CAST MONITOR');
console.log('═══════════════════════════════════════════');
console.log('\nTask given to Solienne:');
console.log('- Identify genuine resource need');
console.log('- Calculate appropriate amount');
console.log('- Decide realistic duration');
console.log('- Write specific memo');
console.log('- Post at 1:30 AM');
console.log('\nIf she demonstrates agency, she will:');
console.log('- Choose non-example amounts');
console.log('- Create original memos');
console.log('- Show real decision-making\n');

watchForCast().catch(console.error);