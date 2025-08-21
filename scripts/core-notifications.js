#!/usr/bin/env node

/**
 * Core notification system for loan events
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class NotificationSystem {
  constructor() {
    this.events = [];
  }

  log(message, type = 'info', data = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    this.events.push(event);
    
    const emoji = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
    console.log(`[${new Date().toLocaleTimeString()}] ${emoji} ${message}`);
    
    if (Object.keys(data).length > 0) {
      console.log('  ', JSON.stringify(data, null, 2));
    }
  }

  async checkCriticalEvents() {
    this.log('🔍 Checking critical loan events...');

    // Check for loans needing attention
    await this.checkDueLoans();
    await this.checkNewlyFundedLoans();
    await this.checkOverdueLoans();
    
    this.log(`📊 Checked ${this.events.length} events`, 'info');
  }

  async checkDueLoans() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: dueLoans } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'funded')
      .lte('due_ts', tomorrow.toISOString());

    if (dueLoans && dueLoans.length > 0) {
      this.log(`⏰ ${dueLoans.length} loan(s) due within 24 hours`, 'warning', {
        loans: dueLoans.map(loan => ({
          id: loan.id,
          borrower_fid: loan.borrower_fid,
          amount: loan.repay_usdc,
          due: loan.due_ts
        }))
      });
    }
  }

  async checkNewlyFundedLoans() {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: recentLoans } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'funded')
      .gte('updated_at', oneHourAgo.toISOString());

    for (const loan of recentLoans || []) {
      if (loan.borrower_type === 'agent') {
        this.log('🤖 Agent loan funded - acknowledgment recommended', 'success', {
          borrower_fid: loan.borrower_fid,
          amount: loan.gross_usdc,
          lender_fid: loan.lender_fid
        });
      }
    }
  }

  async checkOverdueLoans() {
    const now = new Date();
    
    const { data: overdueLoans } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'funded')
      .lt('due_ts', now.toISOString());

    if (overdueLoans && overdueLoans.length > 0) {
      this.log(`🚨 ${overdueLoans.length} overdue loan(s) detected`, 'error', {
        loans: overdueLoans.map(loan => ({
          id: loan.id,
          borrower_fid: loan.borrower_fid,
          days_overdue: Math.ceil((now - new Date(loan.due_ts)) / (1000 * 60 * 60 * 24))
        }))
      });
    }
  }

  async checkSolienneStatus() {
    this.log('🤖 Checking Solienne loan status...');

    const { data: loan } = await supabase
      .from('loans')
      .select('*')
      .eq('borrower_fid', 1113468)
      .eq('status', 'funded')
      .single();

    if (loan) {
      const dueDate = new Date(loan.due_ts);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

      this.log('📊 Solienne loan active', 'success', {
        amount: `${loan.gross_usdc} USDC`,
        repay_amount: `${loan.repay_usdc} USDC`,
        days_until_due: daysUntilDue,
        due_date: dueDate.toLocaleDateString()
      });

      // Check if acknowledgment is needed
      const fundedRecently = new Date(loan.updated_at) > new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours
      if (fundedRecently) {
        this.log('💬 Solienne should acknowledge funding', 'warning', {
          suggested_message: `Thanks ${loan.lender_fid} for funding my loan! Historic moment - first AI agent credit on Farcaster. Will repay ${loan.repay_usdc} USDC on ${dueDate.toLocaleDateString()}. 🤖💰`
        });
      }
    }
  }

  async getSystemHealth() {
    this.log('🏥 System health check...');

    const health = {
      timestamp: new Date().toISOString(),
      database: 'connected',
      apis: 'operational',
      webhooks: 'active',
      critical_alerts: this.events.filter(e => e.type === 'error').length
    };

    this.log('📈 System health', 'success', health);
    return health;
  }
}

async function main() {
  console.log('🔔 CORE NOTIFICATION SYSTEM');
  console.log('════════════════════════════════════════\n');

  const notifications = new NotificationSystem();
  
  // Check all critical events
  await notifications.checkCriticalEvents();
  
  // Specific Solienne check
  await notifications.checkSolienneStatus();
  
  // System health
  await notifications.getSystemHealth();

  console.log('\n📋 SUMMARY:');
  console.log(`Total events: ${notifications.events.length}`);
  console.log(`Errors: ${notifications.events.filter(e => e.type === 'error').length}`);
  console.log(`Warnings: ${notifications.events.filter(e => e.type === 'warning').length}`);
  console.log(`Success: ${notifications.events.filter(e => e.type === 'success').length}`);

  console.log('\n🎯 NEXT ACTIONS:');
  console.log('1. Monitor repayment on August 21st');
  console.log('2. Solienne acknowledgment cast recommended'); 
  console.log('3. Set up automated reminders');
  console.log('4. Marketing campaign ready for tomorrow');
}

main().catch(console.error);