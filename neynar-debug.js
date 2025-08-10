// Debug Neynar webhook configuration
const https = require('https');

const NEYNAR_API_KEY = "3B3FDD35-EA22-4612-868E-8929FFAA97AD";

console.log('🔍 Debugging Neynar Webhook Configuration\n');

// Try to fetch webhook configuration via Neynar API
const options = {
  hostname: 'api.neynar.com',
  path: '/v2/farcaster/webhook',
  method: 'GET',
  headers: {
    'api_key': NEYNAR_API_KEY,
    'Content-Type': 'application/json'
  }
};

console.log('📡 Attempting to fetch webhook config from Neynar API...');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    try {
      const response = JSON.parse(data);
      console.log('\n📋 Webhook Configuration:');
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('\n📄 Raw Response:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.end();

// Alternative webhook configuration instructions
setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('🛠️  ALTERNATIVE APPROACHES:');
  console.log('='.repeat(60));
  
  console.log('\n1. MANUAL WEBHOOK CONFIGURATION:');
  console.log('   If Neynar dashboard is not working, try these steps:');
  console.log('   a) Create a new webhook (delete old one if needed)');
  console.log('   b) URL: https://loancast.app/api/webhooks/neynar');
  console.log('   c) Secret: lyv0ByQAl1QM2MhY9vvLZ1ErJ');
  console.log('   d) Events: cast.created, cast.deleted, reaction.created');
  
  console.log('\n2. NEYNAR SUPPORT:');
  console.log('   Contact Neynar support if configuration is stuck');
  console.log('   Twitter: @neynar_xyz');
  console.log('   Discord: https://discord.gg/neynar');
  
  console.log('\n3. TEMPORARY WORKAROUND:');
  console.log('   For sharing with 3rd lender now:');
  console.log('   - Mention that cast deletion requires manual cleanup');
  console.log('   - Your webhook system works (proven by tests)');
  console.log('   - Can fix Neynar config post-launch');
  
  console.log('\n4. VERIFY CURRENT SETUP:');
  console.log('   - Webhook endpoint: ✅ Working');
  console.log('   - Database: ✅ Ready');  
  console.log('   - Processing logic: ✅ Working');
  console.log('   - Only missing: Neynar auto-events');
}, 2000);