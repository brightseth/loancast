// Script to add the genesis LOANCAST-001 to the database
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY?.trim().replace(/\s+/g, '')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function addGenesisLoan() {
  try {
    // Extract hash from the URL: https://farcaster.xyz/seth/0xaab8ad5d
    const castHash = '0xaab8ad5d'
    
    // Calculate loan details based on the cast
    const amount = 1000 // $1000 USDC
    const monthlyRate = 0.02 // 2%
    const durationMonths = 1 // 30 days
    const yieldBps = 200 // 2% in basis points
    const repayAmount = amount * (1 + monthlyRate) // 1020
    
    // Due date: Sep 2, 2025
    const dueDate = new Date('2025-09-02T00:00:00Z')
    
    // Assume created around when you posted it (3 days ago from context)
    const createdDate = new Date()
    createdDate.setDate(createdDate.getDate() - 3)
    
    const loanData = {
      id: '00000000-1111-1111-1111-111111111111', // Special UUID for genesis loan
      loan_number: 1, // LOANCAST-001
      cast_hash: castHash,
      borrower_fid: 5046, // Your FID
      lender_fid: null, // Not funded yet
      gross_usdc: amount,
      net_usdc: amount * 0.9, // After 10% Farcaster fee
      yield_bps: yieldBps,
      repay_usdc: repayAmount,
      start_ts: createdDate.toISOString(),
      due_ts: dueDate.toISOString(),
      status: 'open',
      tx_fund: null,
      tx_repay: null,
      funded_at: null,
      created_at: createdDate.toISOString(),
      updated_at: createdDate.toISOString()
    }

    console.log('Adding genesis loan:', loanData)
    
    const { data, error } = await supabase
      .from('loans')
      .upsert(loanData, { onConflict: 'id' })
      .select()
    
    if (error) {
      console.error('Error adding genesis loan:', error)
    } else {
      console.log('✅ Genesis LOANCAST-001 added successfully:', data)
    }
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

addGenesisLoan()