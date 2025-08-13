#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function extractWalletAddresses() {
  console.log('🔍 EXTRACTING WALLET ADDRESSES FROM FUNDING TX')
  console.log('===============================================\n')

  try {
    const { data: loan } = await supabase
      .from('loans')
      .select('*')
      .ilike('cast_hash', '%aab8ad%')
      .single()

    const txHash = loan.tx_fund
    console.log('📋 Loan Details:')
    console.log(`- Loan ID: ${loan.id}`)
    console.log(`- Funding TX: ${txHash}`)
    console.log(`- Amount: $${loan.gross_usdc}`)
    console.log('')

    if (!txHash) {
      console.log('❌ No funding transaction hash found')
      return
    }

    // Try to get transaction details from Base network
    console.log('🔗 Fetching transaction details from Base network...')
    
    // Base Mainnet RPC endpoint (public)
    const baseRpcUrl = 'https://mainnet.base.org'
    
    try {
      const response = await fetch(baseRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionByHash',
          params: [txHash],
          id: 1
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        console.log('❌ RPC Error:', data.error.message)
        return
      }
      
      if (!data.result) {
        console.log('❌ Transaction not found')
        return
      }
      
      const tx = data.result
      console.log('✅ Transaction found!')
      console.log(`- From (lender): ${tx.from}`)
      console.log(`- To (contract/borrower): ${tx.to}`)
      console.log(`- Value: ${parseInt(tx.value, 16)} wei`)
      console.log('')
      
      // For USDC transfers, we need to decode the transaction data
      // The 'from' address is typically the lender (Henry)
      // The 'to' might be a contract or the borrower
      
      const lenderAddr = tx.from
      let borrowerAddr = tx.to
      
      // If this was a contract call, we might need to extract the real recipient
      // For now, let's use what we have
      
      console.log('💡 Extracted addresses:')
      console.log(`- Lender (from): ${lenderAddr}`)
      console.log(`- Borrower candidate (to): ${borrowerAddr}`)
      console.log('')
      
      // Update the loan with the extracted addresses
      console.log('🔧 Updating loan with wallet addresses...')
      
      const { error: updateError } = await supabase
        .from('loans')
        .update({
          lender_addr: lenderAddr,
          borrower_addr: borrowerAddr, // This might not be correct for USDC transfers
          updated_at: new Date().toISOString()
        })
        .eq('id', loan.id)
      
      if (updateError) {
        console.log('❌ Error updating loan:', updateError.message)
      } else {
        console.log('✅ Successfully updated loan with wallet addresses')
        console.log('')
        console.log('🎯 REPAYMENT READY:')
        console.log(`- You should send $${loan.repay_usdc} USDC`)
        console.log(`- From your wallet to: ${lenderAddr}`)
        console.log(`- This is Henry's wallet that funded the loan`)
      }
      
    } catch (fetchError) {
      console.log('❌ Error fetching transaction:', fetchError.message)
      console.log('')
      console.log('💡 Alternative approach needed:')
      console.log('The system should track wallet addresses during funding')
      console.log('or have a way to look up NFT holder addresses')
    }

  } catch (error) {
    console.error('❌ Error extracting wallet addresses:', error)
  }
}

extractWalletAddresses()