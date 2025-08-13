#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testRepaymentAPI() {
  console.log('🧪 TESTING REPAYMENT API')
  console.log('========================\n')

  try {
    // Find your loan to Henry
    const loanId = 'b6c98b1d-f440-4829-8d35-cdbffad43545'
    
    console.log('1️⃣ Testing repayment init endpoint...')
    console.log(`Loan ID: ${loanId}`)
    console.log('')

    // Test the repayment init API
    const response = await fetch('http://localhost:3000/api/repay/' + loanId + '/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        borrowerAddr: '0x1234567890123456789012345678901234567890', // Your wallet placeholder
        lenderAddr: undefined // Let the API extract from tx_fund
      })
    })

    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.text()
      console.log('❌ API Error:', errorData)
      return
    }

    const data = await response.json()
    
    console.log('✅ API Response:')
    console.log('================')
    console.log('Success:', data.success)
    console.log('')
    
    if (data.target) {
      console.log('💸 Payment Target:')
      console.log(`- To: ${data.target.to}`)
      console.log(`- Amount: $${data.target.amount}`)
      console.log(`- Chain: ${data.target.chainId}`)
      console.log(`- Token: ${data.target.token}`)
      console.log(`- Memo: ${data.target.memo}`)
      console.log('')
    }
    
    if (data.repayment) {
      console.log('📋 Repayment Details:')
      console.log(`- Loan ID: ${data.repayment.loanId}`)
      console.log(`- Expected Amount: $${data.repayment.expectedUsdc}`)
      console.log(`- Expires At: ${data.repayment.expiresAt}`)
      console.log('')
      
      console.log('📝 Instructions:')
      data.repayment.instructions?.forEach((instruction, i) => {
        console.log(`${i + 1}. ${instruction}`)
      })
    }
    
    console.log('\n🎯 RESULT:')
    if (data.success && data.target?.to) {
      console.log('✅ Repayment API is working!')
      console.log(`✅ Henry's wallet extracted: ${data.target.to}`)
      console.log(`✅ Payment amount: $${data.target.amount}`)
      console.log('')
      console.log('🚀 You can now proceed with the actual repayment:')
      console.log(`   Send $${data.target.amount} USDC to ${data.target.to}`)
    } else {
      console.log('❌ API test failed')
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Start the dev server first:')
      console.log('   npm run dev')
    }
  }
}

testRepaymentAPI()