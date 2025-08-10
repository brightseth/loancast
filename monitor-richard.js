// Monitor for Richard (FID 630) activity on LoanCast
const https = require('https');

console.log('👋 Monitoring for Richard (FID 630) on LoanCast...\n');

async function checkForRichardActivity() {
  console.log('🔍 Checking for Richard\'s activity...');
  
  // Check if Richard has created any loans
  try {
    const response = await new Promise((resolve, reject) => {
      https.get('https://loancast.app/api/loans?borrower_fid=630', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve([]);
          }
        });
      }).on('error', reject);
    });

    if (response.length > 0) {
      console.log('🎉 RICHARD ACTIVITY DETECTED!');
      console.log(`📊 Richard has created ${response.length} loan(s):`);
      response.forEach((loan, i) => {
        console.log(`  ${i + 1}. $${loan.gross_usdc} loan - ${loan.status} - Cast: ${loan.cast_hash}`);
      });
    } else {
      console.log('📋 No loans from Richard yet (FID 630)');
    }
  } catch (error) {
    console.log('❌ Error checking for Richard\'s loans:', error.message);
  }

  // Check if Richard has funded any loans
  try {
    const response = await new Promise((resolve, reject) => {
      https.get('https://loancast.app/api/loans?lender_fid=630', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve([]);
          }
        });
      }).on('error', reject);
    });

    if (response.length > 0) {
      console.log('💰 RICHARD FUNDING DETECTED!');
      console.log(`📊 Richard has funded ${response.length} loan(s):`);
      response.forEach((loan, i) => {
        console.log(`  ${i + 1}. $${loan.gross_usdc} loan to FID ${loan.borrower_fid} - ${loan.status}`);
      });
    } else {
      console.log('💰 Richard hasn\'t funded any loans yet');
    }
  } catch (error) {
    console.log('❌ Error checking Richard\'s funding:', error.message);
  }

  console.log('---');
}

// Check immediately
checkForRichardActivity();

// Set up monitoring every 30 seconds
setInterval(checkForRichardActivity, 30000);

console.log('🔄 Monitoring every 30 seconds for Richard\'s LoanCast activity...');
console.log('📱 Richard (FID 630) - watching for loan creation or funding');
console.log('💡 Press Ctrl+C to stop monitoring\n');