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

async function checkWebhookEventsExtended() {
  console.log('🔍 Extended webhook events analysis...\n')
  
  try {
    // 1. All webhook events in the last hour
    console.log('1. All webhook events in the last hour:')
    const { data: hourlyEvents, error: hourlyError } = await supabase
      .from('webhook_inbox')
      .select('event_id, type, cast_hash, received_at, processed_at, payload')
      .gte('received_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('received_at', { ascending: false })
    
    if (hourlyError) {
      console.error('   ❌ Error fetching hourly events:', hourlyError.message)
    } else {
      console.log(`   📊 Found ${hourlyEvents.length} events in last hour`)
      if (hourlyEvents.length > 0) {
        hourlyEvents.forEach((event, index) => {
          const processedStatus = event.processed_at ? '✅ Processed' : '⏳ Pending'
          console.log(`   ${index + 1}. ${event.type} | ${event.cast_hash || 'N/A'} | ${new Date(event.received_at).toLocaleString()} | ${processedStatus}`)
          
          // Show payload details for cast.deleted events
          if (event.type === 'cast.deleted' && event.payload) {
            console.log(`      📄 Payload: ${JSON.stringify(event.payload, null, 2)}`)
          }
        })
      } else {
        console.log('   📭 No webhook events in the last hour')
      }
    }

    // 2. Check all loans (both active and deleted)
    console.log('\n2. All loans in database (active and deleted):')
    const { data: allLoans, error: allLoansError } = await supabase
      .from('loans')
      .select('id, cast_hash, borrower_fid, status, listing_deleted_at, created_at')
      .order('created_at', { ascending: false })
    
    if (allLoansError) {
      console.error('   ❌ Error fetching all loans:', allLoansError.message)
    } else {
      console.log(`   📊 Total loans in database: ${allLoans.length}`)
      
      const activeLoans = allLoans.filter(loan => !loan.listing_deleted_at)
      const deletedLoans = allLoans.filter(loan => loan.listing_deleted_at)
      
      console.log(`   📊 Active loans: ${activeLoans.length}`)
      console.log(`   📊 Deleted loans: ${deletedLoans.length}`)
      
      console.log('\n   📋 All loans:')
      allLoans.forEach((loan, index) => {
        const deletedStatus = loan.listing_deleted_at ? `🗑️ Deleted at ${new Date(loan.listing_deleted_at).toLocaleString()}` : '✅ Active'
        console.log(`   ${index + 1}. ${loan.id} | Cast: ${loan.cast_hash} | FID: ${loan.borrower_fid} | ${deletedStatus}`)
      })
    }

    // 3. Recent cast.deleted events with more detail (last 24 hours)
    console.log('\n3. Cast.deleted events in last 24 hours:')
    const { data: deletedEvents, error: deletedError } = await supabase
      .from('webhook_inbox')
      .select('*')
      .eq('type', 'cast.deleted')
      .gte('received_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('received_at', { ascending: false })
    
    if (deletedError) {
      console.error('   ❌ Error fetching deleted events:', deletedError.message)
    } else {
      console.log(`   📊 Found ${deletedEvents.length} cast.deleted events in last 24 hours`)
      if (deletedEvents.length > 0) {
        deletedEvents.forEach((event, index) => {
          const processedStatus = event.processed_at ? `✅ Processed at ${new Date(event.processed_at).toLocaleString()}` : '⏳ Pending'
          console.log(`   ${index + 1}. Event ID: ${event.event_id}`)
          console.log(`      Cast Hash: ${event.cast_hash}`)
          console.log(`      Received: ${new Date(event.received_at).toLocaleString()}`)
          console.log(`      Status: ${processedStatus}`)
          if (event.payload) {
            console.log(`      Payload: ${JSON.stringify(event.payload, null, 6)}`)
          }
          console.log()
        })
      } else {
        console.log('   📭 No cast.deleted events in the last 24 hours')
      }
    }

    // 4. Check loan events table for audit trail
    console.log('4. Recent loan events:')
    const { data: loanEvents, error: loanEventsError } = await supabase
      .from('loan_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (loanEventsError) {
      console.error('   ❌ Error fetching loan events:', loanEventsError.message)
    } else {
      console.log(`   📊 Found ${loanEvents.length} recent loan events`)
      if (loanEvents.length > 0) {
        loanEvents.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.kind} | Loan: ${event.loan_id} | ${new Date(event.created_at).toLocaleString()}`)
          if (event.meta && Object.keys(event.meta).length > 0) {
            console.log(`      Meta: ${JSON.stringify(event.meta, null, 6)}`)
          }
        })
      } else {
        console.log('   📭 No loan events found')
      }
    }

    return true
    
  } catch (error) {
    console.error('❌ Extended webhook check failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Extended Webhook Events Analysis\n')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  console.log(`🔑 Using service key: ${supabaseServiceKey.substring(0, 20)}...\n`)
  
  await checkWebhookEventsExtended()
  
  console.log('\n✅ Extended webhook check completed!')
}

if (require.main === module) {
  main().catch(console.error)
}