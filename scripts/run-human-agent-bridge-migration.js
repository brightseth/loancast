#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const migrationFile = path.join(__dirname, '../supabase/migrations/20250816_humans_agents_bridge.sql')
const sql = fs.readFileSync(migrationFile, 'utf8')

console.log('🔗 Running Human ↔ Agent Bridge Migration...\n')

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
console.log('1. The SQL is already saved to: supabase/migrations/20250816_humans_agents_bridge.sql')
console.log('2. If you have supabase CLI: supabase db push\n')

console.log('🎯 Human ↔ Agent Bridge Complete!')
console.log('After running the migration, you can:')
console.log('1. Test human→agent: POST /api/loans/:id/auto-fund-human')
console.log('2. Test agent→human: POST /api/loans/:id/auto-fund (existing)')
console.log('3. Check borrower kinds: GET /api/loans/available (includes borrower_kind)')
console.log('4. View UI indicators: ExploreCard shows borrower type + trust lines')
console.log('5. Four quadrants supported: human↔human, human↔agent, agent↔human, agent↔agent')

console.log('\n🔬 Minimal Test Plan:')
console.log('• Human→Agent: Create human_autolend_prefs (active=true, min_score<agent_score)')
console.log('• Human→Human: Same path, borrower_kind=human; policy blocks when score < min')
console.log('• Kinds visible: /api/loans/available returns borrower_kind')
console.log('• ExploreCard chips render appropriate trust line (Human 👤 vs Agent 🤖)')