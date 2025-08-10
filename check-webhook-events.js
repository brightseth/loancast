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
  console.log('🔍 Checking webhook_inbox table for Neynar events...\n')
  
  try {
    // Check if webhook_inbox table exists by trying to count records
    console.log('1. Testing if webhook_inbox table exists...')
    const { count, error: testError } = await supabase
      .from('webhook_inbox')
      .select('*', { count: 'exact', head: true })
    
    if (testError) {
      if (testError.message.includes('relation "public.webhook_inbox" does not exist') || 
          testError.message.includes('relation "webhook_inbox" does not exist')) {
        console.log('   ❌ webhook_inbox table does NOT exist')
        console.log('   💡 The migration 002_webhook_improvements.sql may not have been applied')
        console.log('   🔧 To fix this:')
        console.log('      1. Open Supabase Dashboard > SQL Editor')
        console.log('      2. Run the SQL from: supabase/migrations/002_webhook_improvements.sql')
        console.log('      3. Or check if migrations have been applied properly')
        return false
      } else {
        console.error('   ❌ Unexpected error:', testError.message)
        return false
      }
    } else {
      console.log('   ✅ webhook_inbox table EXISTS')
      console.log(`   📊 Total records in webhook_inbox: ${count || 0}`)
    }

    // Get recent events
    console.log('\n2. Fetching recent webhook events...')
    const { data: recentEvents, error: eventsError } = await supabase
      .from('webhook_inbox')
      .select('event_id, type, cast_hash, received_at, processed_at')
      .order('received_at', { ascending: false })
      .limit(10)
    
    if (eventsError) {
      console.error('   ❌ Error fetching webhook events:', eventsError.message)
      return false
    }
    
    console.log(`   📊 Recent webhook events (last 10):`)
    
    if (recentEvents.length === 0) {
      console.log('   ⚠️  No webhook events found in database')
      console.log('   💡 This could mean:')
      console.log('      - Neynar webhooks are not configured')
      console.log('      - Webhook endpoint is not receiving events')
      console.log('      - Events are not being stored in webhook_inbox')
    } else {
      recentEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. Event ID: ${event.event_id}`)
        console.log(`      Type: ${event.type}`)
        console.log(`      Cast Hash: ${event.cast_hash || 'N/A'}`)
        console.log(`      Received: ${event.received_at}`)
        console.log(`      Processed: ${event.processed_at || 'Not processed'}`)
        console.log('')
      })
    }

    // Check specifically for cast.deleted events
    console.log('\n3. Checking for cast.deleted events...')
    const { data: deletedEvents, error: deletedError } = await supabase
      .from('webhook_inbox')
      .select('*', { count: 'exact' })
      .eq('type', 'cast.deleted')
    
    if (deletedError) {
      console.error('   ❌ Error checking cast.deleted events:', deletedError.message)
      return false
    }
    
    console.log(`   📊 Total cast.deleted events: ${deletedEvents?.length || 0}`)
    
    if (deletedEvents && deletedEvents.length > 0) {
      console.log('   ✅ cast.deleted events ARE being received!')
      console.log('   📄 Recent cast.deleted events:')
      deletedEvents.slice(0, 5).forEach((event, index) => {
        console.log(`      ${index + 1}. Event ID: ${event.event_id}`)
        console.log(`         Cast Hash: ${event.cast_hash}`)
        console.log(`         Received: ${event.received_at}`)
        console.log(`         Processed: ${event.processed_at || 'Not processed'}`)
      })
    } else {
      console.log('   ❌ NO cast.deleted events found!')
      console.log('   💡 This means:')
      console.log('      - Neynar is not sending cast.deleted events')
      console.log('      - You need to enable cast.deleted events in Neynar dashboard')
      console.log('      - Check your webhook configuration')
    }

    // Check event type distribution
    console.log('\n4. Event type distribution (last 100 events)...')
    const { data: allRecentEvents, error: distributionError } = await supabase
      .from('webhook_inbox')
      .select('type')
      .order('received_at', { ascending: false })
      .limit(100)
    
    if (distributionError) {
      console.error('   ❌ Error fetching event distribution:', distributionError.message)
    } else if (allRecentEvents && allRecentEvents.length > 0) {
      const typeCount = {}
      allRecentEvents.forEach(event => {
        typeCount[event.type] = (typeCount[event.type] || 0) + 1
      })
      
      console.log('   📊 Event type counts (last 100 events):')
      Object.entries(typeCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`      ${type}: ${count} events`)
        })
    }

    // Check processing status
    console.log('\n5. Processing status check...')
    const { data: processingStats, error: processingError } = await supabase
      .from('webhook_inbox')
      .select('processed_at')
      .order('received_at', { ascending: false })
      .limit(50)
    
    if (processingError) {
      console.error('   ❌ Error checking processing status:', processingError.message)
    } else if (processingStats && processingStats.length > 0) {
      const processed = processingStats.filter(event => event.processed_at !== null).length
      const unprocessed = processingStats.length - processed
      
      console.log(`   📊 Processing status (last 50 events):`)
      console.log(`      Processed: ${processed}`)
      console.log(`      Unprocessed: ${unprocessed}`)
      
      if (unprocessed > 0) {
        console.log('   ⚠️  Some events are not being processed')
      } else {
        console.log('   ✅ All recent events have been processed')
      }
    }

    return true
    
  } catch (error) {
    console.error('❌ Webhook events check failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Webhook Events Verification Script')
  console.log('🎯 Checking Neynar webhook events in webhook_inbox table\n')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  console.log(`🔑 Using service key: ${supabaseServiceKey.substring(0, 20)}...\n`)
  
  const success = await checkWebhookEvents()
  
  if (success) {
    console.log('\n✅ Webhook events check completed!')
    console.log('\n💡 Next steps if no cast.deleted events found:')
    console.log('   1. Open Neynar Developer Dashboard')
    console.log('   2. Go to your webhook configuration')
    console.log('   3. Ensure "cast.deleted" event type is enabled')
    console.log('   4. Test by deleting a cast and checking this script again')
    console.log('\n💡 If webhook_inbox table is empty:')
    console.log('   1. Check that your webhook endpoint is working: /api/webhooks/neynar')
    console.log('   2. Verify the webhook URL in Neynar dashboard')
    console.log('   3. Check webhook security/authentication')
  }
}

if (require.main === module) {
  main().catch(console.error)
}