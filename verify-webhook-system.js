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

async function verifyWebhookSystem() {
  console.log('🔍 Verifying webhook system is working properly...\n')
  
  try {
    // Query 1: Recent webhook events
    console.log('1. Recent webhook events:')
    console.log('   Query: SELECT event_id, type, cast_hash, received_at, processed_at FROM webhook_inbox ORDER BY received_at DESC LIMIT 5;\n')
    
    const { data: recentEvents, error: eventsError } = await supabase
      .from('webhook_inbox')
      .select('event_id, type, cast_hash, received_at, processed_at')
      .order('received_at', { ascending: false })
      .limit(5)
    
    if (eventsError) {
      console.error('   ❌ Error fetching webhook events:', eventsError.message)
      return false
    }
    
    if (recentEvents.length === 0) {
      console.log('   📊 No webhook events found')
      console.log('   ⚠️  This indicates webhooks are not being received/stored\n')
    } else {
      console.log('   📊 Results:')
      recentEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. Event ID: ${event.event_id}`)
        console.log(`      Type: ${event.type}`)
        console.log(`      Cast Hash: ${event.cast_hash || 'N/A'}`)
        console.log(`      Received: ${event.received_at}`)
        console.log(`      Processed: ${event.processed_at || 'NULL (not processed)'}`)
        console.log('')
      })
    }

    // Query 2: Check if loans have been marked as deleted
    console.log('2. Check if loans have been marked as deleted:')
    console.log('   Query: SELECT id, cast_hash, status, listing_deleted_at, updated_at FROM loans WHERE listing_deleted_at IS NOT NULL ORDER BY updated_at DESC;\n')
    
    const { data: deletedLoans, error: deletedError } = await supabase
      .from('loans')
      .select('id, cast_hash, status, listing_deleted_at, updated_at')
      .not('listing_deleted_at', 'is', null)
      .order('updated_at', { ascending: false })
    
    if (deletedError) {
      console.error('   ❌ Error fetching deleted loans:', deletedError.message)
      return false
    }
    
    if (deletedLoans.length === 0) {
      console.log('   📊 No loans marked as deleted (listing_deleted_at IS NULL for all loans)')
      console.log('   ⚠️  This could mean:')
      console.log('      - No cast.deleted webhook events have been processed yet')
      console.log('      - Webhook processing is not working properly')
      console.log('      - No loan casts have been deleted\n')
    } else {
      console.log(`   📊 Found ${deletedLoans.length} deleted loans:`)
      deletedLoans.forEach((loan, index) => {
        console.log(`   ${index + 1}. Loan ID: ${loan.id}`)
        console.log(`      Cast Hash: ${loan.cast_hash}`)
        console.log(`      Status: ${loan.status}`)
        console.log(`      Deleted At: ${loan.listing_deleted_at}`)
        console.log(`      Updated At: ${loan.updated_at}`)
        console.log('')
      })
    }

    // Query 3: Check current loan visibility (what the API should return)
    console.log('3. Check current loan visibility (what the API should return):')
    console.log('   Query: SELECT count(*) as visible_loans FROM loans WHERE listing_deleted_at IS NULL;\n')
    
    const { data: visibleCountData, error: visibleError } = await supabase
      .from('loans')
      .select('*', { count: 'exact', head: true })
      .is('listing_deleted_at', null)
    
    if (visibleError) {
      console.error('   ❌ Error counting visible loans:', visibleError.message)
      return false
    }
    
    console.log(`   📊 Visible loans (API should return): ${visibleCountData?.length || 0}`)

    // Additional check: Total loans vs visible loans
    const { data: totalCountData, error: totalError } = await supabase
      .from('loans')
      .select('*', { count: 'exact', head: true })
    
    if (!totalError) {
      const totalLoans = totalCountData?.length || 0
      const visibleLoans = visibleCountData?.length || 0
      const hiddenLoans = totalLoans - visibleLoans
      
      console.log(`   📊 Total loans in database: ${totalLoans}`)
      console.log(`   📊 Hidden loans (deleted): ${hiddenLoans}`)
      console.log('')
    }

    // Summary and diagnosis
    console.log('📋 SYSTEM STATUS SUMMARY:')
    console.log('═══════════════════════════')
    
    const hasWebhookEvents = recentEvents.length > 0
    const hasDeletedLoans = deletedLoans.length > 0
    const visibleLoans = visibleCountData?.length || 0
    
    if (hasWebhookEvents) {
      console.log('✅ Webhook events are being received and stored')
    } else {
      console.log('❌ No webhook events found - webhooks may not be configured properly')
    }
    
    if (hasDeletedLoans) {
      console.log('✅ Loan deletions are being processed (webhook system working)')
    } else {
      console.log('⚠️  No deleted loans found - either no deletions occurred or processing failed')
    }
    
    console.log(`📊 API will return ${visibleLoans} visible loans`)
    
    if (!hasWebhookEvents) {
      console.log('\n🔧 NEXT STEPS:')
      console.log('   1. Check webhook configuration in Neynar dashboard')
      console.log('   2. Verify webhook endpoint: /api/webhooks/neynar is accessible')
      console.log('   3. Check webhook authentication/security settings')
      console.log('   4. Test webhook by creating/deleting a cast')
    } else if (!hasDeletedLoans) {
      console.log('\n🔧 POSSIBLE ISSUES:')
      console.log('   1. cast.deleted events may not be enabled in Neynar')
      console.log('   2. Webhook processing logic may have errors')
      console.log('   3. No actual cast deletions have occurred yet')
    } else {
      console.log('\n✅ Webhook system appears to be working correctly!')
      console.log('   - Events are being received')
      console.log('   - Loan deletions are being processed')
      console.log('   - API filtering should work properly')
    }

    return true
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Webhook System Verification')
  console.log('🎯 Checking if webhooks are working and loans are being processed\n')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  console.log(`🔑 Using service key: ${supabaseServiceKey.substring(0, 20)}...\n`)
  
  await verifyWebhookSystem()
  
  console.log('\n✅ Verification completed!')
}

if (require.main === module) {
  main().catch(console.error)
}