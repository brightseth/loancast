// Script to manually delete a loan from the database
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

async function deleteLoan() {
  try {
    const loanId = '998c4164-e7b6-4380-9c9a-5cd9b6f4e395'
    const castHash = '0x58864827760c68d037016a21e42806cbcbee389b'
    
    console.log(`Attempting to delete loan with ID: ${loanId}`)
    console.log(`Cast hash: ${castHash}`)
    
    // First, let's verify the loan exists and get its details
    const { data: existingLoan, error: fetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single()
    
    if (fetchError) {
      console.error('Error fetching loan:', fetchError)
      return
    }
    
    if (!existingLoan) {
      console.log('❌ Loan not found')
      return
    }
    
    console.log('📋 Current loan details:')
    console.log(`- ID: ${existingLoan.id}`)
    console.log(`- Cast Hash: ${existingLoan.cast_hash}`)
    console.log(`- Borrower FID: ${existingLoan.borrower_fid}`)
    console.log(`- Status: ${existingLoan.status}`)
    console.log(`- Amount: ${existingLoan.gross_usdc} USDC`)
    console.log(`- Loan Number: ${existingLoan.loan_number}`)
    
    // Verify this matches the expected loan details
    if (existingLoan.cast_hash !== castHash) {
      console.error('❌ Cast hash mismatch! Expected:', castHash, 'Got:', existingLoan.cast_hash)
      return
    }
    
    if (existingLoan.borrower_fid !== 5046) {
      console.error('❌ Borrower FID mismatch! Expected: 5046, Got:', existingLoan.borrower_fid)
      return
    }
    
    if (existingLoan.status !== 'open') {
      console.error('❌ Loan status is not "open"! Current status:', existingLoan.status)
      return
    }
    
    if (existingLoan.gross_usdc !== 125) {
      console.error('❌ Loan amount mismatch! Expected: 125 USDC, Got:', existingLoan.gross_usdc)
      return
    }
    
    console.log('✅ Loan details verified. Proceeding with deletion...')
    
    // Delete the loan
    const { error: deleteError } = await supabase
      .from('loans')
      .delete()
      .eq('id', loanId)
    
    if (deleteError) {
      console.error('❌ Error deleting loan:', deleteError)
    } else {
      console.log('✅ Loan deleted successfully!')
      console.log(`Deleted loan ${loanId} with cast hash ${castHash}`)
    }
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

deleteLoan()