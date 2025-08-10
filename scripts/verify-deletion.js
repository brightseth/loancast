// Script to verify that a loan was successfully deleted from the database
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

async function verifyDeletion() {
  try {
    const loanId = '998c4164-e7b6-4380-9c9a-5cd9b6f4e395'
    const castHash = '0x58864827760c68d037016a21e42806cbcbee389b'
    
    console.log(`Verifying deletion of loan with ID: ${loanId}`)
    console.log(`Cast hash: ${castHash}`)
    
    // Try to fetch the loan
    const { data: loan, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single()
    
    if (error && error.code === 'PGRST116') {
      console.log('✅ Verification successful: Loan has been completely deleted from the database')
    } else if (error) {
      console.error('❌ Error during verification:', error)
    } else if (loan) {
      console.log('❌ Loan still exists in database:', loan)
    }
    
    // Also check by cast_hash to be sure
    const { data: loansByCast, error: castError } = await supabase
      .from('loans')
      .select('*')
      .eq('cast_hash', castHash)
    
    if (castError) {
      console.error('Error checking by cast hash:', castError)
    } else if (loansByCast && loansByCast.length === 0) {
      console.log('✅ Double verification: No loans found with cast hash ' + castHash)
    } else {
      console.log('❌ Found loans with cast hash:', loansByCast)
    }
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

verifyDeletion()