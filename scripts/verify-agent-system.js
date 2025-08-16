#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTables() {
  console.log('\n📊 Verifying Tables...\n');
  
  const tables = [
    'agents',
    'agent_sessions', 
    'agent_limits',
    'agent_loans',
    'agent_stats',
    'human_autolend_prefs',
    'funding_intents'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (error && error.code === '42P01') {
      console.log(`❌ Table ${table} does not exist`);
      allTablesExist = false;
    } else {
      console.log(`✅ Table ${table} exists`);
    }
  }
  
  return allTablesExist;
}

async function verifyColumns() {
  console.log('\n📋 Verifying Loan Table Columns...\n');
  
  // Try to select the new columns
  const { data, error } = await supabase
    .from('loans')
    .select('id, borrower_type, lender_type')
    .limit(1);
  
  if (error) {
    if (error.message.includes('borrower_type')) {
      console.log('❌ Column borrower_type missing from loans table');
      return false;
    }
    if (error.message.includes('lender_type')) {
      console.log('❌ Column lender_type missing from loans table');
      return false;
    }
  }
  
  console.log('✅ borrower_type column exists');
  console.log('✅ lender_type column exists');
  return true;
}

async function verifyFunctions() {
  console.log('\n🔧 Verifying Database Functions...\n');
  
  // Test the sum_agent_spend_last24h function
  const { data, error } = await supabase
    .rpc('sum_agent_spend_last24h', { p_agent_fid: 999001 });
  
  if (error) {
    console.log('❌ Function sum_agent_spend_last24h not found or errored:', error.message);
    return false;
  }
  
  console.log('✅ Function sum_agent_spend_last24h exists');
  return true;
}

async function testAgentRegistration() {
  console.log('\n🤖 Testing Agent Registration...\n');
  
  const testAgentFid = 999999;
  
  // First delete if exists
  await supabase
    .from('agents')
    .delete()
    .eq('agent_fid', testAgentFid);
  
  // Try to insert
  const { data, error } = await supabase
    .from('agents')
    .insert({
      agent_fid: testAgentFid,
      controller_fid: 12345,
      wallet: '0x' + '0'.repeat(40),
      agent_type: 'lp',
      strategy: { test: true },
      policy: { daily_cap: 100 }
    })
    .select()
    .single();
  
  if (error) {
    console.log('❌ Failed to register test agent:', error.message);
    return false;
  }
  
  console.log('✅ Agent registration successful');
  
  // Check if stats were created
  const { data: stats } = await supabase
    .from('agent_stats')
    .select('*')
    .eq('agent_fid', testAgentFid)
    .single();
  
  if (stats) {
    console.log('✅ Agent stats created automatically');
  } else {
    console.log('⚠️ Agent stats not created (trigger may not be working)');
  }
  
  // Check if limits were created
  const { data: limits } = await supabase
    .from('agent_limits')
    .select('*')
    .eq('agent_fid', testAgentFid)
    .single();
  
  if (limits) {
    console.log('✅ Agent limits created automatically');
  } else {
    console.log('⚠️ Agent limits not created (trigger may not be working)');
  }
  
  // Clean up
  await supabase
    .from('agents')
    .delete()
    .eq('agent_fid', testAgentFid);
  
  return true;
}

async function checkExistingData() {
  console.log('\n📈 Checking Existing Data...\n');
  
  const { count: agentCount } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true });
  
  const { count: loanCount } = await supabase
    .from('loans')
    .select('*', { count: 'exact', head: true });
  
  const { count: intentCount } = await supabase
    .from('funding_intents')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Agents registered: ${agentCount || 0}`);
  console.log(`Total loans: ${loanCount || 0}`);
  console.log(`Funding intents: ${intentCount || 0}`);
  
  return true;
}

async function testSampleQuery() {
  console.log('\n🔍 Testing Sample Queries...\n');
  
  // Test the available loans query with types
  const { data: loans, error } = await supabase
    .from('loans')
    .select('id, borrower_fid, borrower_type, gross_usdc, status')
    .eq('status', 'seeking')
    .limit(5);
  
  if (error) {
    console.log('❌ Failed to query loans with types:', error.message);
    return false;
  }
  
  console.log(`✅ Found ${loans?.length || 0} seeking loans`);
  
  if (loans && loans.length > 0) {
    console.log('Sample loan:', {
      id: loans[0].id.substring(0, 8) + '...',
      borrower_fid: loans[0].borrower_fid,
      borrower_type: loans[0].borrower_type || 'human (default)',
      amount: loans[0].gross_usdc + ' USDC'
    });
  }
  
  return true;
}

async function main() {
  console.log('========================================');
  console.log('   LoanCast Agent System Verification   ');
  console.log('========================================');
  
  let allPassed = true;
  
  // Run all verifications
  allPassed = await verifyTables() && allPassed;
  allPassed = await verifyColumns() && allPassed;
  allPassed = await verifyFunctions() && allPassed;
  allPassed = await testAgentRegistration() && allPassed;
  allPassed = await checkExistingData() && allPassed;
  allPassed = await testSampleQuery() && allPassed;
  
  console.log('\n========================================');
  if (allPassed) {
    console.log('✅ ALL VERIFICATIONS PASSED!');
    console.log('The agent system is fully operational.');
  } else {
    console.log('⚠️ SOME VERIFICATIONS FAILED');
    console.log('Please run the migration script and try again.');
  }
  console.log('========================================\n');
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);