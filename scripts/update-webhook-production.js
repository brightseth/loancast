#!/usr/bin/env node

/**
 * Update Neynar webhook to production URL
 */

require('dotenv').config({ path: '.env.local' });

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const WEBHOOK_ID = '01K2S4XCDVVP0933ZGXFWVR0G9'; // loancast-bids webhook
const PRODUCTION_URL = 'https://loancast.app/api/webhooks/neynar-bids';

async function updateWebhook() {
  console.log('🔧 Updating webhook to production URL');
  console.log('═══════════════════════════════════════════\n');
  
  try {
    // Update webhook
    const response = await fetch(`https://api.neynar.com/v2/farcaster/webhook`, {
      method: 'PUT',
      headers: {
        'api_key': NEYNAR_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhook_id: WEBHOOK_ID,
        name: 'LoanCast Bids (Production)',
        url: PRODUCTION_URL,
        subscription: {
          'cast.created': {
            author_fids: [], // All authors
            mentioned_fids: []
          }
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to update webhook:', error);
      
      // Try creating a new one instead
      console.log('\n📝 Creating new webhook instead...');
      return createNewWebhook();
    }
    
    const result = await response.json();
    console.log('✅ Webhook updated successfully!');
    console.log('   ID:', result.webhook_id || WEBHOOK_ID);
    console.log('   URL:', PRODUCTION_URL);
    console.log('   Status: Active');
    
  } catch (error) {
    console.error('❌ Error updating webhook:', error.message);
    console.log('\n💡 Trying to create a new webhook...');
    return createNewWebhook();
  }
}

async function createNewWebhook() {
  try {
    const response = await fetch('https://api.neynar.com/v2/farcaster/webhook', {
      method: 'POST',
      headers: {
        'api_key': NEYNAR_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'LoanCast Bids Production',
        url: PRODUCTION_URL,
        subscription: {
          'cast.created': {
            author_fids: [], // All authors
            mentioned_fids: []
          }
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to create webhook:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ New webhook created!');
    console.log('   ID:', result.webhook_id);
    console.log('   URL:', PRODUCTION_URL);
    console.log('   Status: Active');
    console.log('\n🎯 Production webhook is ready!');
    
  } catch (error) {
    console.error('❌ Error creating webhook:', error.message);
  }
}

// Run the update
updateWebhook();