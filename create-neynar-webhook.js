// Create a new Neynar webhook with all required events
const https = require('https');

const NEYNAR_API_KEY = "3B3FDD35-EA22-4612-868E-8929FFAA97AD";

console.log('🔧 Creating New Neynar Webhook...\n');

// Webhook configuration with all required events
const webhookData = JSON.stringify({
  name: "loancast app",
  url: "https://loancast.app/api/webhooks/neynar",
  secret: "lyv0ByQAl1QM2MhY9vvLZ1ErJ",
  event_types: [
    "cast.created",
    "cast.deleted",
    "reaction.created"
  ],
  active: true
});

const options = {
  hostname: 'api.neynar.com',
  path: '/v2/farcaster/webhook',
  method: 'POST',
  headers: {
    'api_key': NEYNAR_API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(webhookData)
  }
};

console.log('📡 Creating webhook with configuration:');
console.log('Name: loancast app');
console.log('URL: https://loancast.app/api/webhooks/neynar');
console.log('Events: cast.created, cast.deleted, reaction.created');
console.log('Secret: lyv0ByQAl1QM2MhY9vvLZ1ErJ');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📊 Response Status: ${res.statusCode}`);
    
    try {
      const response = JSON.parse(data);
      console.log('\n✅ Webhook Creation Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n🎉 SUCCESS! New webhook created with:');
        console.log('✅ cast.created events enabled');
        console.log('✅ cast.deleted events enabled');
        console.log('✅ reaction.created events enabled');
        
        if (response.webhook_id) {
          console.log(`\n📝 New Webhook ID: ${response.webhook_id}`);
        }
        
        console.log('\n🧪 Ready to test automatic deletion!');
      } else {
        console.log('\n❌ Webhook creation failed.');
        console.log('💡 Try manual creation in dashboard');
      }
    } catch (e) {
      console.log('\n📄 Raw Response:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  console.log('\n💡 Manual alternative: Create in Neynar dashboard with:');
  console.log('   - URL: https://loancast.app/api/webhooks/neynar');
  console.log('   - Secret: lyv0ByQAl1QM2MhY9vvLZ1ErJ');
  console.log('   - Events: cast.created, cast.deleted, reaction.created');
});

req.write(webhookData);
req.end();