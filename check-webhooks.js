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

async function checkWebhookEvents() {
  console.log('🔍 Checking webhook events...\n')
  
  try {
    // 1. Recent webhook events (last 5 minutes)
    console.log('1. Recent webhook events (last 5 minutes):')
    const { data: recentEvents, error: recentError } = await supabase
      .from('webhook_inbox')
      .select('event_id, type, cast_hash, received_at, processed_at')
      .gte('received_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('received_at', { ascending: false })
    
    if (recentError) {
      console.error('   ❌ Error fetching recent events:', recentError.message)
    } else {
      console.log(`   📊 Found ${recentEvents.length} events in last 5 minutes`)
      if (recentEvents.length > 0) {
        recentEvents.forEach((event, index) => {
          const processedStatus = event.processed_at ? '✅ Processed' : '⏳ Pending'
          console.log(`   ${index + 1}. ${event.type} | ${event.cast_hash || 'N/A'} | ${event.received_at} | ${processedStatus}`)
        })
      } else {
        console.log('   📭 No webhook events received in the last 5 minutes')
      }
    }

    // 2. Cast deleted events (last 10 minutes)
    console.log('\n2. Cast deleted events (last 10 minutes):')
    const { data: deletedEvents, error: deletedError } = await supabase
      .from('webhook_inbox')
      .select('event_id, cast_hash, received_at, processed_at')
      .eq('type', 'cast.deleted')
      .gte('received_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('received_at', { ascending: false })
    
    if (deletedError) {
      console.error('   ❌ Error fetching deleted events:', deletedError.message)
    } else {
      console.log(`   📊 Found ${deletedEvents.length} cast.deleted events in last 10 minutes`)
      if (deletedEvents.length > 0) {
        deletedEvents.forEach((event, index) => {
          const processedStatus = event.processed_at ? '✅ Processed' : '⏳ Pending'
          console.log(`   ${index + 1}. Cast: ${event.cast_hash} | Received: ${event.received_at} | ${processedStatus}`)
        })
      } else {
        console.log('   📭 No cast.deleted events in the last 10 minutes')
      }
    }

    // 3. All webhook events today for context
    console.log('\n3. All webhook events today (for context):')
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const { data: todayEvents, error: todayError } = await supabase
      .from('webhook_inbox')
      .select('event_id, type, cast_hash, received_at, processed_at')
      .gte('received_at', todayStart.toISOString())
      .order('received_at', { ascending: false })
    
    if (todayError) {
      console.error('   ❌ Error fetching today\'s events:', todayError.message)
    } else {
      console.log(`   📊 Found ${todayEvents.length} total events today`)
      
      // Group by type
      const eventsByType = {}
      todayEvents.forEach(event => {
        if (!eventsByType[event.type]) {
          eventsByType[event.type] = { total: 0, processed: 0 }
        }
        eventsByType[event.type].total++
        if (event.processed_at) {
          eventsByType[event.type].processed++
        }
      })
      
      console.log('   📋 Events by type:')
      Object.entries(eventsByType).forEach(([type, stats]) => {
        console.log(`      ${type}: ${stats.total} total (${stats.processed} processed)`)
      })
    }

    // 4. Current loan count for reference
    console.log('\n4. Current loan count (active loans):')
    const { data: activeLoans, error: loansError } = await supabase
      .from('loans')
      .select('id, cast_hash, borrower_fid, created_at')
      .is('listing_deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (loansError) {
      console.error('   ❌ Error fetching loans:', loansError.message)
    } else {
      console.log(`   📊 Current active loan count: ${activeLoans.length}`)
      console.log('   📋 Active loans:')
      activeLoans.forEach((loan, index) => {
        console.log(`      ${index + 1}. ${loan.id} | Cast: ${loan.cast_hash} | FID: ${loan.borrower_fid}`)
      })
    }

    // 5. Check for unprocessed webhooks
    console.log('\n5. Unprocessed webhook events:')
    const { data: unprocessedEvents, error: unprocessedError } = await supabase
      .from('webhook_inbox')
      .select('event_id, type, cast_hash, received_at')
      .is('processed_at', null)
      .order('received_at', { ascending: false })
    
    if (unprocessedError) {
      console.error('   ❌ Error fetching unprocessed events:', unprocessedError.message)
    } else {
      console.log(`   📊 Found ${unprocessedEvents.length} unprocessed events`)
      if (unprocessedEvents.length > 0) {
        unprocessedEvents.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.type} | ${event.cast_hash || 'N/A'} | ${event.received_at}`)
        })
      }
    }

    return true
    
  } catch (error) {
    console.error('❌ Webhook check failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Webhook Events Check\n')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  console.log(`🔑 Using service key: ${supabaseServiceKey.substring(0, 20)}...\n`)
  
  await checkWebhookEvents()
  
  console.log('\n✅ Webhook check completed!')
}

if (require.main === module) {
  main().catch(console.error)
}