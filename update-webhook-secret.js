// Update webhook secret to match our application
const https = require('https');

const NEYNAR_API_KEY = "3B3FDD35-EA22-4612-868E-8929FFAA97AD";
const WEBHOOK_ID = "01K28YNJKEDR9B7GQGG21B2BFN";

console.log('🔧 Updating webhook secret to match application...\n');

// Update secret to match our app configuration
const updateData = JSON.stringify({
  secret: "lyv0ByQAl1QM2MhY9vvLZ1ErJ"
});

const options = {
  hostname: 'api.neynar.com',
  path: `/v2/farcaster/webhook/${WEBHOOK_ID}`,
  method: 'PATCH',
  headers: {
    'api_key': NEYNAR_API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(updateData)
  }
};

console.log('📡 Updating webhook secret...');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📊 Response Status: ${res.statusCode}`);
    
    try {
      const response = JSON.parse(data);
      console.log('\n✅ Secret Update Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n🎉 SUCCESS! Webhook secret updated');
        console.log('✅ Secret now matches application configuration');
        console.log('\n🧪 Ready to test automatic cast deletion!');
        console.log('1. Current loan count should be 3');
        console.log('2. Delete your test loan cast on Farcaster');
        console.log('3. Wait 30-60 seconds');
        console.log('4. Check loan count drops to 2');
      } else {
        console.log('\n⚠️  Secret update may not be needed - testing anyway');
      }
    } catch (e) {
      console.log('\n📄 Raw Response:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(updateData);
req.end();