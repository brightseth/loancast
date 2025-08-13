#!/usr/bin/env node

// Simple script to help set up Farcaster signer
const { NeynarAPIClient } = require('@neynar/nodejs-sdk')
require('dotenv').config({ path: '.env.local' })

async function setupSigner() {
  console.log('🔑 FARCASTER SIGNER SETUP')
  console.log('========================\n')
  
  const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY)
  const signerUuid = '50a91609-928c-4f80-b904-6ccc38b78981'
  
  try {
    // Check current signer status
    console.log('1. Checking signer status...')
    const signer = await client.lookupSigner(signerUuid)
    console.log('Signer status:', signer.status)
    console.log('Public key:', signer.public_key)
    
    if (signer.status === 'approved') {
      console.log('✅ Signer is already approved and ready to use!')
      return
    }
    
    console.log('\n2. To approve this signer:')
    console.log('   a) Open Warpcast on your phone')
    console.log('   b) Go to Settings → Advanced → "Add signing key"')
    console.log('   c) Scan QR code or enter this token manually:')
    console.log(`   
    TOKEN: ${signerUuid}
    `)
    console.log('   d) Approve the signing key in Warpcast')
    
    console.log('\n3. Alternative: Try this URL in your mobile browser:')
    console.log(`https://client.warpcast.com/deeplinks/signed-key-request?token=${signerUuid}`)
    
    console.log('\n4. Once approved, run this script again to verify!')
    
  } catch (error) {
    console.error('Error:', error.message)
    console.log('\nTip: The signer might need to be registered first.')
  }
}

setupSigner()