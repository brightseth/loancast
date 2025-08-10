#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function quickCheck() {
  console.log('🔍 Quick webhook inbox check...\n')
  
  try {
    // Try different approaches to access webhook_inbox
    console.log('1. Trying direct count...')
    const { count: totalCount, error: countError } = await supabase
      .from('webhook_inbox')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('   ❌ Count failed:', countError.message)
    } else {
      console.log(`   ✅ Total webhook events: ${totalCount}`)
    }

    // Try selecting with service role bypass
    console.log('\n2. Trying query with service role...')
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: 'SELECT event_id, type, cast_hash, received_at, processed_at FROM webhook_inbox ORDER BY received_at DESC LIMIT 10'
      })
    
    if (error) {
      console.log('   ❌ RPC failed:', error.message)
      
      // Try direct query instead
      console.log('\n3. Trying direct query...')
      const result = await supabase
        .from('webhook_inbox')
        .select('event_id, type, cast_hash, received_at, processed_at')
        .order('received_at', { ascending: false })
        .limit(10)
      
      if (result.error) {
        console.log('   ❌ Direct query failed:', result.error.message)
        
        // Check if we can at least see the schema
        console.log('\n4. Checking what we can access...')
        try {
          // Try accessing loans table as a control
          const { count: loanCount } = await supabase
            .from('loans')
            .select('*', { count: 'exact', head: true })
          console.log(`   ✅ Can access loans table, ${loanCount} records`)
          
          // Try loan_events table
          const { count: eventCount } = await supabase
            .from('loan_events')
            .select('*', { count: 'exact', head: true })
          console.log(`   ✅ Can access loan_events table, ${eventCount} records`)
          
          // Try bid_proposals table  
          const { count: bidCount } = await supabase
            .from('bid_proposals')
            .select('*', { count: 'exact', head: true })
          console.log(`   ✅ Can access bid_proposals table, ${bidCount} records`)
          
        } catch (e) {
          console.log('   ❌ Can\'t access other tables:', e.message)
        }
      } else {
        console.log('   ✅ Direct query worked!')
        console.log('   📊 Recent events:')
        result.data?.forEach((event, index) => {
          console.log(`      ${index + 1}. ${event.type} | ${event.event_id} | ${event.received_at}`)
        })
      }
    } else {
      console.log('   ✅ RPC worked!')
      console.log('   📊 Query results:', data)
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

quickCheck().catch(console.error)