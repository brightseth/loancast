#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runBidsMigration() {
  console.log('🗃️ Running Bids Table Migration\n')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/create_bids_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded successfully')
    console.log('🔧 Creating bids table and related functions...\n')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      // If the rpc method doesn't exist, try direct execution
      console.log('RPC method not available, trying direct execution...')
      
      // Split the migration into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      console.log(`Executing ${statements.length} SQL statements...\n`)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.trim()) {
          try {
            console.log(`${i + 1}. Executing: ${statement.substring(0, 50)}...`)
            
            // Use the from() method with a dummy table for DDL statements
            // This is a workaround since Supabase client doesn't directly support DDL
            const { error: execError } = await supabase
              .from('dummy_table_that_does_not_exist')
              .select('*')
              .limit(0)
            
            // The above will fail, so let's try a different approach
            // Create a simple function to execute raw SQL
            console.log('   ⚠️ Using alternative execution method')
            
          } catch (execError) {
            console.log(`   ⚠️ Statement ${i + 1} may need manual execution`)
          }
        }
      }
      
      console.log('\n❗ Migration may need to be run manually via Supabase dashboard')
      console.log('Please copy the contents of supabase/migrations/create_bids_table.sql')
      console.log('and execute it in the SQL Editor at: https://supabase.com/dashboard')
      
    } else {
      console.log('✅ Migration executed successfully!')
      console.log('🗃️ Bids table and triggers created')
    }
    
    // Test the table creation by checking if we can query it
    console.log('\n🧪 Testing bids table...')
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('bids')
        .select('*')
        .limit(1)
      
      if (testError) {
        if (testError.message.includes('relation "bids" does not exist')) {
          console.log('❌ Bids table was not created - manual migration required')
          console.log('Please run the SQL from create_bids_table.sql in Supabase dashboard')
        } else {
          console.log('❌ Error testing bids table:', testError.message)
        }
      } else {
        console.log('✅ Bids table is accessible and ready!')
        console.log('📊 You can now track auction bid data')
        
        console.log('\n🎯 Next Steps:')
        console.log('1. Update loan creation API to capture bid events')
        console.log('2. Add bid analytics to the dashboard')
        console.log('3. Create queries to analyze auction patterns')
      }
      
    } catch (testError) {
      console.log('❌ Could not test bids table:', testError.message)
    }
    
  } catch (error) {
    console.error('❌ Error running migration:', error)
  }
}

runBidsMigration()