#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const migrationFile = path.join(__dirname, '../supabase/migrations/20250815_agent_p1.sql')
const sql = fs.readFileSync(migrationFile, 'utf8')

console.log('🤖 Running Agent P1 Migration...\n')

console.log('📋 Migration SQL:')
console.log('================')
console.log(sql)

console.log('\n⚠️  IMPORTANT: Since we cannot execute DDL directly via Supabase client,')
console.log('you need to run the above SQL in one of these ways:\n')

console.log('Option 1 - Supabase Dashboard:')
console.log('1. Go to: https://supabase.com/dashboard/project/qvafjicbrsoyzdlgypuq/sql')
console.log('2. Paste the SQL above')
console.log('3. Click "Run"\n')

console.log('Option 2 - Save to file and use Supabase CLI:')
console.log('1. The SQL is already saved to: supabase/migrations/20250815_agent_p1.sql')
console.log('2. If you have supabase CLI: supabase db push\n')

console.log('🎯 Agent P1 Setup Complete!')
console.log('After running the migration, you can:')
console.log('1. Test agent auth: POST /api/agents/auth')
console.log('2. Get available loans: GET /api/loans/available')
console.log('3. Auto-fund loans: POST /api/loans/:id/auto-fund')
console.log('4. Run the reference bot: cd agents && node reference-bot.js')