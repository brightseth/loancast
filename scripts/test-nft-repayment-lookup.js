#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testNFTRepaymentLookup() {
  console.log('🔍 TESTING NFT-BASED REPAYMENT LOOKUP')
  console.log('=====================================\n')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get your loan details
    const { data: loan } = await supabase
      .from('loans')
      .select('*')
      .ilike('cast_hash', '%aab8ad%')
      .single()

    console.log('📋 Loan Details:')
    console.log(`- Loan ID: ${loan.id}`)
    console.log(`- Cast Hash: ${loan.cast_hash}`)
    console.log(`- Lender FID: ${loan.lender_fid} (Henry)`)
    console.log(`- Amount to repay: $${loan.repay_usdc}`)
    console.log('')

    // Test the repayment init API with NFT lookup
    console.log('🧪 Testing repayment init with NFT lookup...')
    
    const response = await fetch('http://localhost:3002/api/repay/' + loan.id + '/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        borrowerAddr: '0x1234567890123456789012345678901234567890' // Your wallet placeholder
        // No lenderAddr - will be looked up from NFT
      })
    })

    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ API Error:')
      console.log(errorText)
      
      // Try to parse as JSON for better error display
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error) {
          console.log('Error message:', errorJson.error)
        }
      } catch (e) {
        // Not JSON, already logged above
      }
      
      return
    }

    const data = await response.json()
    
    console.log('✅ NFT-Based Repayment Lookup Result:')
    console.log('====================================')
    
    if (data.target) {
      console.log('💸 Payment Target (from NFT holder):')
      console.log(`- To: ${data.target.to}`)
      console.log(`- Amount: $${data.target.amount}`)
      console.log(`- Is this Henry's wallet? ${data.target.to === '0xA2DCc567A04f85c0f62A2AFf712DFcA022aA88D1' ? 'YES ✅' : 'NO ❌'}`)
      console.log('')
      
      console.log('📋 Repayment Instructions:')
      if (data.repayment?.instructions) {
        data.repayment.instructions.forEach((instruction, i) => {
          console.log(`${i + 1}. ${instruction}`)
        })
      }
    } else {
      console.log('❌ No payment target returned')
    }

  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('❌ Dev server not running. Please start with: npm run dev')
    } else {
      console.error('❌ Test error:', error.message)
    }
  }
}

testNFTRepaymentLookup()