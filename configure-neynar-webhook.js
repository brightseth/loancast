// Configure Neynar webhook to enable cast.deleted events
const https = require('https');

const NEYNAR_API_KEY = "3B3FDD35-EA22-4612-868E-8929FFAA97AD";
const WEBHOOK_ID = "01K21933GY721THB0PFBE92Q0M";

console.log('🔧 Configuring Neynar Webhook Events...\n');

// Configuration data to enable cast.deleted events
const configData = JSON.stringify({
  event_types: [
    'cast.created',
    'cast.deleted', 
    'reaction.created'
  ]
});

const options = {
  hostname: 'api.neynar.com',
  path: `/v2/farcaster/webhook/${WEBHOOK_ID}`,
  method: 'PUT',
  headers: {
    'api_key': NEYNAR_API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(configData)
  }
};

console.log('📡 Updating webhook configuration...');
console.log('Webhook ID:', WEBHOOK_ID);
console.log('Events to enable:', ['cast.created', 'cast.deleted', 'reaction.created']);

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📊 Response Status: ${res.statusCode}`);
    
    try {
      const response = JSON.parse(data);
      console.log('\n✅ Configuration Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n🎉 SUCCESS! Webhook events configured:');
        console.log('✅ cast.created');
        console.log('✅ cast.deleted');
        console.log('✅ reaction.created');
        
        console.log('\n🧪 Ready to test:');
        console.log('1. Create a small test loan');
        console.log('2. Delete the cast on Farcaster');
        console.log('3. Check if loan automatically disappears');
      } else {
        console.log('\n❌ Configuration failed. Try manual setup in dashboard.');
      }
    } catch (e) {
      console.log('\n📄 Raw Response:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  console.log('\n💡 Alternative: Configure manually in Neynar dashboard');
});

req.write(configData);
req.end();