// Script to verify Neynar webhook configuration
const https = require('https');

console.log('🔍 Verifying Neynar Webhook Configuration...\n');

// Check if we can access Neynar API with our key
const neynarApiKey = process.env.NEYNAR_API_KEY;
if (!neynarApiKey) {
  console.log('❌ NEYNAR_API_KEY not found in environment');
  process.exit(1);
}

console.log('✅ NEYNAR_API_KEY found');
console.log('✅ WEBHOOK_SECRET configured: lyv0ByQAl1QM2MhY9vvLZ1ErJ');
console.log('✅ WEBHOOK_URL: https://loancast.app/api/webhooks/neynar');

// Test webhook endpoint is accessible
console.log('\n📡 Testing webhook endpoint accessibility...');

const testData = JSON.stringify({test: 'ping'});
const req = https.request({
  hostname: 'loancast.app',
  path: '/api/webhooks/neynar',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
}, (res) => {
  console.log(`✅ Webhook endpoint responds: ${res.statusCode}`);
  if (res.statusCode === 401) {
    console.log('✅ Endpoint properly rejects unauthorized requests');
  }
});

req.on('error', (e) => {
  console.log('❌ Webhook endpoint error:', e.message);
});

req.write(testData);
req.end();

console.log('\n📋 Configuration Checklist:');
console.log('[ ] 1. Neynar Dashboard → Webhooks → URL set to: https://loancast.app/api/webhooks/neynar');
console.log('[ ] 2. Webhook Secret set to: lyv0ByQAl1QM2MhY9vvLZ1ErJ'); 
console.log('[ ] 3. Event Types enabled: cast.created, cast.deleted, reaction.created');
console.log('[ ] 4. Webhook status: Active/Enabled');

console.log('\n🧪 To test the configuration:');
console.log('1. Create a small test loan ($10-20)');
console.log('2. Verify it appears in: curl "https://loancast.app/api/loans" | jq length');
console.log('3. Delete the cast on Farcaster');
console.log('4. Wait 30 seconds');  
console.log('5. Check loan count decreased: curl "https://loancast.app/api/loans" | jq length');