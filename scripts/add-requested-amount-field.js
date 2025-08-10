#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Adding requested_usdc field to loans table...')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/add_requested_amount.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.includes('ALTER TABLE') || statement.includes('UPDATE') || statement.includes('COMMENT') || statement.includes('CREATE INDEX')) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error('Error:', error)
        } else {
          console.log('✅ Success')
        }
      }
    }
    
    // Test the new field
    console.log('\n📊 Testing new field...')
    const { data, error } = await supabase
      .from('loans')
      .select('id, requested_usdc, gross_usdc')
      .limit(3)
    
    if (error) {
      console.error('Test query error:', error)
    } else {
      console.log('Sample data:', data)
    }
    
    console.log('\n✅ Migration complete!')
    console.log('\n📈 Now you can track:')
    console.log('- requested_usdc: What borrower originally asked for')
    console.log('- gross_usdc: What was actually funded after auction')
    console.log('- Funding efficiency: (gross_usdc / requested_usdc) * 100%')
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()