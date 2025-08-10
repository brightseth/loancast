const crypto = require('crypto');

// Test webhook with proper signature
const secret = "lyv0ByQAl1QM2MhY9vvLZ1ErJ";
const payload = JSON.stringify({
  type: "cast.deleted",
  event_id: "test_deletion_" + Date.now(),
  data: {
    hash: "0x58864827760c68d037016a21e42806cbcbee389b"
  },
  created_at: new Date().toISOString()
});

// Generate proper HMAC signature
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload, 'utf8')
  .digest('hex');

console.log('Payload:', payload);
console.log('Signature:', 'sha256=' + signature);

// Test the webhook
const fetch = require('node-fetch');

async function testWebhook() {
  try {
    const response = await fetch('https://loancast.app/api/webhooks/neynar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-neynar-signature': 'sha256=' + signature
      },
      body: payload
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testWebhook();