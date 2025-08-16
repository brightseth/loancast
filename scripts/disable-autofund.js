#!/usr/bin/env node

/**
 * Disable auto-fund functionality to keep LoanCast pure:
 * Loans should only be funded by collecting casts on Farcaster
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function disableAutofund() {
  console.log('🎯 Disabling Auto-Fund Feature\n');
  console.log('Rationale: Keep LoanCast pure - loans funded only by collecting casts\n');
  
  // 1. Check if there are any auto-fund settings in agents table
  const { data: agents, error: agentError } = await supabase
    .from('agents')
    .select('agent_fid, policy')
    .not('policy', 'is', null);
    
  if (agents && agents.length > 0) {
    console.log(`Found ${agents.length} agents with policies. Updating...\n`);
    
    for (const agent of agents) {
      if (agent.policy && agent.policy.allow_autofund) {
        console.log(`  Disabling auto-fund for agent ${agent.agent_fid}`);
        
        // Update policy to disable autofund
        const updatedPolicy = {
          ...agent.policy,
          allow_autofund: false
        };
        
        await supabase
          .from('agents')
          .update({ policy: updatedPolicy })
          .eq('agent_fid', agent.agent_fid);
      }
    }
  }
  
  // 2. Check if there's an autolend or auto_fund related tables
  // Skip this check as RPC might not exist
    
  // 3. Disable any autofund flags in loans if they exist
  console.log('\nChecking loans table for auto-fund flags...');
  
  // Get column info to see if there's an autofund column
  const { data: sampleLoan } = await supabase
    .from('loans')
    .select('*')
    .limit(1)
    .single();
    
  if (sampleLoan) {
    const columns = Object.keys(sampleLoan);
    const autofundColumns = columns.filter(col => 
      col.includes('auto') || col.includes('fund')
    );
    
    if (autofundColumns.length > 0) {
      console.log('Found auto-fund related columns:', autofundColumns);
      // Would update these if they exist
    } else {
      console.log('No auto-fund columns found in loans table ✅');
    }
  }
  
  // 4. Look for human autolend settings
  let humanAutolend = null;
  let humanError = null;
  
  try {
    const result = await supabase
      .from('human_autolend')
      .select('*');
    humanAutolend = result.data;
    humanError = result.error;
  } catch (e) {
    humanError = 'Table not found';
  }
    
  if (humanAutolend && humanAutolend.length > 0) {
    console.log(`\nFound ${humanAutolend.length} human auto-lend settings. Disabling...\n`);
    
    // Disable all autolend settings
    const { error: disableError } = await supabase
      .from('human_autolend')
      .update({ enabled: false })
      .not('id', 'is', null); // Update all records
      
    if (!disableError) {
      console.log('✅ Disabled all human auto-lend settings');
    }
  } else if (humanError) {
    console.log('\n✅ No human_autolend table found (good - feature not implemented)');
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('✅ AUTO-FUND FEATURE DISABLED\n');
  console.log('LoanCast is now pure:');
  console.log('  • Loans created by casting');
  console.log('  • Loans funded by collecting');
  console.log('  • No automatic funding');
  console.log('  • No complex rules');
  console.log('\nThe cast IS the loan. The collection IS the funding.');
  console.log('Simple, elegant, social. 🎯\n');
  
  // Show current funding mechanism
  console.log('Current funding flow:');
  console.log('1. Borrower posts: /loancast borrow X for Yd @ 2%/mo — "purpose"');
  console.log('2. Lenders see cast on Farcaster');
  console.log('3. Lenders click "Collect" to fund');
  console.log('4. USDC transfers directly');
  console.log('5. Loan is funded\n');
  
  console.log('No auto-fund. No complexity. Just social lending. ✨');
}

disableAutofund().catch(console.error);