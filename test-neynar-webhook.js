// Test Neynar webhook configuration
const crypto = require('crypto');

console.log('🧪 Testing Neynar Webhook Configuration...\n');

// Test with the new webhook secret that Neynar assigned
const secret = "_9rlszuWdfjw4Tf6lQO4IFf-H";
const payload = JSON.stringify({
  type: "cast.created",
  event_id: "test_config_" + Date.now(),
  data: {
    hash: "0xtest456",
    author: { fid: 5046 }
  },
  created_at: new Date().toISOString()
});

// Generate HMAC signature
const signature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload, 'utf8')
  .digest('hex');

console.log('🔧 Configuration Summary:');
console.log('✅ Webhook ID: 01K28YNJKEDR9B7GQGG21B2BFN');
console.log('✅ URL: https://loancast.app/api/webhooks/neynar');
console.log('✅ Events: cast.created, cast.deleted, reaction.created');
console.log('✅ Secret: _9rlszuWdfjw4Tf6lQO4IFf-H');
console.log('✅ Status: Active');

console.log('\n📡 Testing webhook endpoint...');

// Test the webhook endpoint
const https = require('https');
const testData = JSON.stringify({ signature, payload });

const req = https.request({
  hostname: 'loancast.app',
  path: '/api/webhooks/neynar',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-neynar-signature': signature
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200 && response.success) {
        console.log('\n🎉 SUCCESS! Webhook configuration is working!');
        console.log('✅ Endpoint accessible');
        console.log('✅ Signature verification working');
        console.log('✅ Event processing working');
        
        console.log('\n🧪 Ready for real test:');
        console.log('1. Current loan count: 3');
        console.log('2. Delete your test loan cast on Farcaster');
        console.log('3. Wait 30-60 seconds');
        console.log('4. Check: curl "https://loancast.app/api/loans" | jq length');
        console.log('5. Should show 2 (automatic deletion worked!)');
        
      } else {
        console.log('\n⚠️  Configuration issue detected');
        console.log('May need to wait for environment variable deployment');
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Connection error:', e.message);
});

req.write(payload);
req.end();