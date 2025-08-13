#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function runMigration() {
  console.log('🚀 Running borrower_stats migration...')
  
  try {
    // Read the migration file
    const sql = fs.readFileSync('./supabase/migrations/create_borrower_stats.sql', 'utf8')
    
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';'
      
      if (statement.includes('CREATE TABLE') || 
          statement.includes('CREATE INDEX') ||
          statement.includes('CREATE OR REPLACE FUNCTION') ||
          statement.includes('CREATE TRIGGER') ||
          statement.includes('DROP TRIGGER')) {
        
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        })
        
        if (error && !error.message.includes('already exists')) {
          console.error(`Error in statement ${i + 1}:`, error.message)
          console.log('Statement:', statement.substring(0, 100) + '...')
        }
      }
    }
    
    console.log('✅ Migration completed!')
    
    // Test by computing stats for FID 5046
    console.log('🧮 Computing initial stats for FID 5046...')
    
    const { error: computeError } = await supabase.rpc('recompute_borrower_stats', {
      p_fid: 5046
    })
    
    if (computeError) {
      console.error('Error computing stats:', computeError.message)
    } else {
      console.log('✅ Stats computed successfully!')
      
      // Fetch and display the results
      const { data: stats, error: fetchError } = await supabase
        .from('borrower_stats')
        .select('*')
        .eq('fid', 5046)
        .single()
        
      if (fetchError) {
        console.error('Error fetching stats:', fetchError.message)
      } else {
        console.log('📊 Your credit profile:')
        console.log(`- Score: ${stats.score}/900 (Tier ${stats.tier})`)
        console.log(`- Loans: ${stats.loans_repaid}/${stats.loans_total} repaid`)
        console.log(`- On-time rate: ${Math.round(stats.on_time_rate * 100)}%`)
        console.log(`- Streak: ${stats.longest_on_time_streak}`)
      }
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()