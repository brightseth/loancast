#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up LoanCast Miniapp...\n')

// 1. Verify manifest file exists
const manifestPath = path.join(__dirname, '../.well-known/farcaster.json')
if (fs.existsSync(manifestPath)) {
  console.log('✅ Farcaster manifest file exists')
} else {
  console.log('❌ Farcaster manifest file missing')
  process.exit(1)
}

// 2. Check environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_NEYNAR_API_KEY',
  'NEXT_PUBLIC_USDC_CONTRACT_ADDRESS'
]

console.log('\n📋 Checking environment variables:')
const missing = []
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}`)
  } else {
    console.log(`❌ ${envVar}`)
    missing.push(envVar)
  }
})

if (missing.length > 0) {
  console.log(`\n⚠️  Missing environment variables. Add these to your .env.local:`)
  missing.forEach(envVar => {
    console.log(`${envVar}=your_value_here`)
  })
}

// 3. Check if public directory contains brand assets
const brandAssets = [
  'brand/LoanCast_Icon_Square.png',
  'brand/LoanCast_Social_Preview.png'
]

console.log('\n🎨 Checking brand assets:')
brandAssets.forEach(asset => {
  const assetPath = path.join(__dirname, '../public', asset)
  if (fs.existsSync(assetPath)) {
    console.log(`✅ ${asset}`)
  } else {
    console.log(`❌ ${asset} - Run the brand installer script first`)
  }
})

// 4. Verify Next.js configuration
const nextConfigPath = path.join(__dirname, '../next.config.js')
if (fs.existsSync(nextConfigPath)) {
  console.log('\n✅ Next.js configuration exists')
} else {
  console.log('\n❌ Next.js configuration missing')
}

console.log('\n🔧 Setup Instructions:')
console.log('1. Deploy your app to Vercel or similar platform')
console.log('2. Ensure your domain serves the manifest at /.well-known/farcaster.json')
console.log('3. Enable Developer Mode in Farcaster settings')
console.log('4. Test your miniapp at: https://your-domain.com/miniapp')
console.log('5. Submit for verification at: https://miniapps.farcaster.xyz/docs/guides/publishing')

console.log('\n🎭 Miniapp Features:')
console.log('• Quick loan requests with auto-cast generation')
console.log('• Browse and fund active loans')  
console.log('• View reputation and loan history')
console.log('• Integrated USDC wallet transactions')
console.log('• Mobile-optimized interface')

console.log('\n✨ Ready to launch your miniapp!')