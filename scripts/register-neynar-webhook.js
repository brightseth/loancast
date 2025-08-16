#!/usr/bin/env node

/**
 * Register Neynar webhook for real-time bid capture
 */

require('dotenv').config({ path: '.env.local' });

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://loancast.app/api/webhooks/neynar-bids';

if (!NEYNAR_API_KEY) {
  console.error('❌ NEYNAR_API_KEY not found in .env.local');
  console.log('Add it to .env.local:');
  console.log('NEYNAR_API_KEY=your_api_key_here');
  process.exit(1);
}

async function registerWebhook() {
  console.log('📡 Registering Neynar webhook for bid capture');
  console.log('═══════════════════════════════════════════\n');
  
  const webhookConfig = {
    name: 'loancast-bids',
    url: WEBHOOK_URL,
    subscription: {
      'cast.created': {
        author_fids: [], // All authors
        mentioned_fids: []
      },
      'reaction.created': {
        author_fids: [],
        reaction_types: ['like', 'recast']
      }
    }
  };
  
  try {
    const response = await fetch('https://api.neynar.com/v2/farcaster/webhook', {
      method: 'POST',
      headers: {
        'api_key': NEYNAR_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookConfig)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register webhook: ${error}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Webhook registered successfully!');
    console.log('   ID:', result.webhook_id);
    console.log('   URL:', result.url);
    console.log('   Events:', Object.keys(result.subscription).join(', '));
    console.log('\n📝 Save this webhook ID to manage it later:', result.webhook_id);
    
    // List existing webhooks
    console.log('\n📋 Fetching all webhooks...');
    const listResponse = await fetch('https://api.neynar.com/v2/farcaster/webhook/list', {
      headers: {
        'api_key': NEYNAR_API_KEY
      }
    });
    
    if (listResponse.ok) {
      const webhooks = await listResponse.json();
      console.log(`\nFound ${webhooks.webhooks.length} webhook(s):`);
      webhooks.webhooks.forEach(wh => {
        console.log(`   - ${wh.title} (${wh.webhook_id}): ${wh.url}`);
        console.log(`     Events: ${Object.keys(wh.subscription).join(', ')}`);
        console.log(`     Active: ${wh.active}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error registering webhook:', error.message);
    console.log('\n💡 Tips:');
    console.log('1. Make sure NEYNAR_API_KEY is valid');
    console.log('2. For local testing, use ngrok: ngrok http 3002');
    console.log('3. Set WEBHOOK_URL to your ngrok URL + /api/webhooks/neynar-bids');
  }
}

// Also provide unregister function
async function unregisterWebhook(webhookId) {
  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/webhook`, {
      method: 'DELETE',
      headers: {
        'api_key': NEYNAR_API_KEY
      },
      body: JSON.stringify({ webhook_id: webhookId })
    });
    
    if (response.ok) {
      console.log(`✅ Webhook ${webhookId} deleted`);
    } else {
      console.error(`❌ Failed to delete webhook: ${await response.text()}`);
    }
  } catch (error) {
    console.error('❌ Error deleting webhook:', error);
  }
}

// Parse command line args
const args = process.argv.slice(2);
if (args[0] === 'delete' && args[1]) {
  unregisterWebhook(args[1]);
} else {
  registerWebhook();
}