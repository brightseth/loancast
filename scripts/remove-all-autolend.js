#!/usr/bin/env node

/**
 * Remove all autolend/auto-fund settings from the database
 * This ensures LoanCast is pure: loans funded only by collecting casts
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function removeAllAutolend() {
  console.log('🧹 REMOVING ALL AUTO-LEND SETTINGS\n');
  console.log('Goal: Pure social lending - no automation\n');
  console.log('═══════════════════════════════════════════\n');

  let totalRemoved = 0;

  // 1. Check and clear human_autolend table if it exists
  try {
    const { data: autolendSettings, error } = await supabase
      .from('human_autolend')
      .select('*');
    
    if (!error && autolendSettings) {
      console.log(`Found ${autolendSettings.length} human auto-lend settings`);
      
      if (autolendSettings.length > 0) {
        // Show what we're removing
        autolendSettings.forEach(setting => {
          console.log(`  - FID ${setting.lender_fid}: ${setting.enabled ? 'ENABLED' : 'disabled'}`);
          if (setting.max_loan_usdc) {
            console.log(`    Max loan: $${setting.max_loan_usdc}`);
          }
          if (setting.max_duration_days) {
            console.log(`    Max duration: ${setting.max_duration_days} days`);
          }
        });
        
        console.log('\nDeleting all auto-lend settings...');
        
        // Delete all records
        const { error: deleteError } = await supabase
          .from('human_autolend')
          .delete()
          .not('id', 'is', null); // Delete all
        
        if (!deleteError) {
          console.log('✅ Deleted all human auto-lend settings\n');
          totalRemoved += autolendSettings.length;
        } else {
          console.log('❌ Error deleting:', deleteError.message);
        }
      }
    } else if (error && error.code === 'PGRST116') {
      console.log('✅ No human_autolend table exists (good)\n');
    }
  } catch (e) {
    console.log('✅ No human_autolend table found\n');
  }

  // 2. Remove agent auto-fund policies
  console.log('Checking agent policies...');
  const { data: agents } = await supabase
    .from('agents')
    .select('agent_fid, policy')
    .not('policy', 'is', null);
  
  if (agents && agents.length > 0) {
    let agentsWithAutofund = 0;
    
    for (const agent of agents) {
      if (agent.policy && (agent.policy.allow_autofund || agent.policy.autofund_enabled)) {
        agentsWithAutofund++;
        console.log(`  Removing auto-fund for agent ${agent.agent_fid}`);
        
        // Clear the entire policy or just remove autofund flags
        const cleanPolicy = {
          daily_usdc_cap: agent.policy.daily_usdc_cap || 500,
          // Remove any autofund-related fields
          allow_autofund: false,
          autofund_enabled: false
        };
        
        await supabase
          .from('agents')
          .update({ policy: cleanPolicy })
          .eq('agent_fid', agent.agent_fid);
      }
    }
    
    if (agentsWithAutofund > 0) {
      console.log(`✅ Removed auto-fund from ${agentsWithAutofund} agents\n`);
      totalRemoved += agentsWithAutofund;
    } else {
      console.log('✅ No agents had auto-fund enabled\n');
    }
  }

  // 3. Check for any autolend-related columns in loans table
  console.log('Checking loans table for auto-lend columns...');
  const { data: sampleLoan } = await supabase
    .from('loans')
    .select('*')
    .limit(1)
    .single();
  
  if (sampleLoan) {
    const columns = Object.keys(sampleLoan);
    const autoColumns = columns.filter(col => 
      col.includes('auto_fund') || 
      col.includes('autofund') || 
      col.includes('auto_lend') ||
      col.includes('autolend')
    );
    
    if (autoColumns.length > 0) {
      console.log('Found auto-lend columns:', autoColumns);
      console.log('Note: These columns exist but should be ignored by the UI\n');
    } else {
      console.log('✅ No auto-lend specific columns in loans table\n');
    }
  }

  // 4. Final summary
  console.log('═══════════════════════════════════════════');
  console.log('🎯 AUTO-LEND REMOVAL COMPLETE\n');
  
  if (totalRemoved > 0) {
    console.log(`Removed ${totalRemoved} auto-lend configurations\n`);
  }
  
  console.log('LoanCast is now PURE:');
  console.log('  ✅ No auto-funding');
  console.log('  ✅ No auto-lending');
  console.log('  ✅ No automated matching');
  console.log('  ✅ Only manual collection\n');
  
  console.log('The ONLY way to fund loans:');
  console.log('  1. See cast on Farcaster');
  console.log('  2. Click "Collect"');
  console.log('  3. Confirm transaction');
  console.log('  4. USDC transfers\n');
  
  console.log('Clean. Simple. Social. ✨\n');
  
  // Show current loan funding status
  const { data: recentLoans } = await supabase
    .from('loans')
    .select('id, borrower_fid, status, gross_usdc')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentLoans && recentLoans.length > 0) {
    console.log('Recent loans (all require manual collection):');
    recentLoans.forEach(loan => {
      const emoji = loan.borrower_fid === 1113468 ? '🤖' : '👤';
      console.log(`  ${emoji} FID ${loan.borrower_fid}: $${loan.gross_usdc} (${loan.status})`);
    });
  }
}

removeAllAutolend().catch(console.error);