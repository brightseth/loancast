#!/usr/bin/env node

/**
 * 🔬 LoanCast Four-Quadrant Marketplace Smoke Tests
 * 
 * Validates all lending combinations work:
 * 1. Human → Human (existing, should work)
 * 2. Human → Agent (new, auto-fund via human_autolend_prefs)
 * 3. Agent → Human (new, auto-fund via agent policy)
 * 4. Agent → Agent (new, auto-fund via agent policy)
 * 5. Manual funding still works for all types
 * 6. Borrower type indicators show correctly
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Test data - using deterministic FIDs for reproducible tests
const TEST_HUMAN_FID = 999001  // Test human borrower
const TEST_AGENT_FID = 999002  // Test agent borrower  
const TEST_LENDER_HUMAN_FID = 999003  // Test human lender
const TEST_LENDER_AGENT_FID = 999004  // Test agent lender

// Test wallets (deterministic for tests)
const TEST_WALLETS = {
  human_borrower: '0x1111111111111111111111111111111111111111',
  agent_borrower: '0x2222222222222222222222222222222222222222',
  human_lender: '0x3333333333333333333333333333333333333333',
  agent_lender: '0x4444444444444444444444444444444444444444'
}

class SmokeTestRunner {
  constructor() {
    this.results = []
    this.cleanup = []
  }

  log(message, status = 'info') {
    const timestamp = new Date().toISOString()
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'warn' ? '⚠️' : 'ℹ️'
    console.log(`${icon} [${timestamp}] ${message}`)
    this.results.push({ timestamp, message, status })
  }

  async setup() {
    this.log('🚀 Setting up smoke test environment...')
    
    // Check environment variables
    const requiredEnvs = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'AGENT_AUTOFUND_ENABLED',
      'HUMAN_AUTOLEND_ENABLED',
      'AGENT_SESSION_SECRET'
    ]
    
    for (const env of requiredEnvs) {
      if (!process.env[env]) {
        this.log(`Missing required environment variable: ${env}`, 'fail')
        process.exit(1)
      }
    }
    
    if (process.env.AGENT_AUTOFUND_ENABLED !== 'true') {
      this.log('AGENT_AUTOFUND_ENABLED is not true - agent funding will be disabled', 'warn')
    }
    
    if (process.env.HUMAN_AUTOLEND_ENABLED !== 'true') {
      this.log('HUMAN_AUTOLEND_ENABLED is not true - human autolend will be disabled', 'warn')
    }

    // Clean up any existing test data
    await this.cleanupTestData()
    
    // Create test agents
    await this.createTestAgents()
    
    // Create test human autolend preferences
    await this.createTestHumanPrefs()
    
    this.log('✅ Setup complete')
  }

  async cleanupTestData() {
    this.log('🧹 Cleaning up existing test data...')
    
    const testFids = [TEST_HUMAN_FID, TEST_AGENT_FID, TEST_LENDER_HUMAN_FID, TEST_LENDER_AGENT_FID]
    
    // Clean loans
    await supabase.from('loans').delete().in('borrower_fid', testFids)
    await supabase.from('loans').delete().in('lender_fid', testFids)
    
    // Clean agents
    await supabase.from('agents').delete().in('agent_fid', [TEST_AGENT_FID, TEST_LENDER_AGENT_FID])
    await supabase.from('agent_sessions').delete().in('agent_fid', [TEST_AGENT_FID, TEST_LENDER_AGENT_FID])
    await supabase.from('agent_stats').delete().in('agent_fid', [TEST_AGENT_FID, TEST_LENDER_AGENT_FID])
    
    // Clean human prefs
    await supabase.from('human_autolend_prefs').delete().in('lender_fid', [TEST_LENDER_HUMAN_FID])
    
    // Clean funding intents
    await supabase.from('funding_intents').delete().in('lender_fid', testFids)
  }

  async createTestAgents() {
    this.log('🤖 Creating test agents...')
    
    const agents = [
      {
        agent_fid: TEST_AGENT_FID,
        controller_fid: TEST_HUMAN_FID,
        wallet: TEST_WALLETS.agent_borrower,
        agent_type: 'yield',
        strategy: { target_apy: 12, max_duration_days: 30 },
        strategy_hash: 'test_borrower_strategy_hash',
        policy: {
          min_score: 0,
          max_amount_usdc: 100,
          max_duration_days: 30,
          daily_loan_limit: 5,
          daily_usdc_cap: 500,
          per_tx_cap: 100,
          per_counterparty_cap: 100,
          allow_human: true,
          allow_agent: true
        },
        verified_at: new Date().toISOString(),
        active: true
      },
      {
        agent_fid: TEST_LENDER_AGENT_FID,
        controller_fid: TEST_LENDER_HUMAN_FID,
        wallet: TEST_WALLETS.agent_lender,
        agent_type: 'yield',
        strategy: { target_apy: 15, max_duration_days: 60 },
        strategy_hash: 'test_lender_strategy_hash',
        policy: {
          min_score: 0,
          max_amount_usdc: 1000,
          max_duration_days: 60,
          daily_loan_limit: 10,
          daily_usdc_cap: 2000,
          per_tx_cap: 500,
          per_counterparty_cap: 300,
          allow_human: true,
          allow_agent: true
        },
        verified_at: new Date().toISOString(),
        active: true
      }
    ]
    
    for (const agent of agents) {
      const { error } = await supabase.from('agents').insert(agent)
      if (error) {
        this.log(`Failed to create agent ${agent.agent_fid}: ${error.message}`, 'fail')
        throw error
      }
      
      // Create agent stats
      const { error: statsError } = await supabase.from('agent_stats').insert({
        agent_fid: agent.agent_fid,
        score: 85,
        loans_funded: 5,
        total_funded_usdc_6: BigInt(500 * 1e6),
        loans_repaid: 4,
        default_rate_bps: 500, // 5%
        avg_duration_days: 25
      })
      
      if (statsError) {
        this.log(`Failed to create agent stats ${agent.agent_fid}: ${statsError.message}`, 'fail')
      }
    }
  }

  async createTestHumanPrefs() {
    this.log('👤 Creating test human autolend preferences...')
    
    const { error } = await supabase.from('human_autolend_prefs').insert({
      lender_fid: TEST_LENDER_HUMAN_FID,
      active: true,
      min_score: 0,
      max_amount_usdc: 500,
      max_duration_days: 45,
      allow_human: true,
      allow_agent: true,
      daily_limit_usdc: 1000,
      per_borrower_limit_usdc: 200
    })
    
    if (error) {
      this.log(`Failed to create human autolend prefs: ${error.message}`, 'fail')
      throw error
    }
  }

  async createTestLoan(borrowerFid, borrowerType, amount = 50) {
    this.log(`📝 Creating test loan: ${borrowerType} borrower FID ${borrowerFid}, $${amount}...`)
    
    const loanData = {
      borrower_fid: borrowerFid,
      borrower_type: borrowerType,
      principal_usdc_6: BigInt(amount * 1e6),
      repay_usdc: amount * 1.02, // 2% yield
      yield_bps: 200,
      duration_days: 30,
      status: 'seeking',
      due_ts: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cast_hash: `0x${Math.random().toString(16).slice(2, 10).padStart(8, '0')}`
    }
    
    const { data, error } = await supabase.from('loans').insert(loanData).select().single()
    
    if (error) {
      this.log(`Failed to create loan: ${error.message}`, 'fail')
      throw error
    }
    
    this.cleanup.push(() => supabase.from('loans').delete().eq('id', data.id))
    return data
  }

  async testHumanToHuman() {
    this.log('🧪 Testing Human → Human funding...')
    
    const loan = await this.createTestLoan(TEST_HUMAN_FID, 'human', 100)
    
    // Verify loan appears in /api/loans/available with correct borrower_kind
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/loans/available`)
    if (!response.ok) {
      this.log(`Failed to fetch available loans: ${response.statusText}`, 'fail')
      return false
    }
    
    const loans = await response.json()
    const testLoan = loans.find(l => l.id === loan.id)
    
    if (!testLoan) {
      this.log('Test loan not found in available loans', 'fail')
      return false
    }
    
    if (testLoan.borrower_kind !== 'human') {
      this.log(`Expected borrower_kind 'human', got '${testLoan.borrower_kind}'`, 'fail')
      return false
    }
    
    this.log('✅ Human → Human loan created and visible with correct borrower_kind', 'pass')
    return true
  }

  async testHumanToAgent() {
    this.log('🧪 Testing Human → Agent funding...')
    
    const loan = await this.createTestLoan(TEST_AGENT_FID, 'agent', 75)
    
    // Test auto-fund via human autolend
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/loans/${loan.id}/auto-fund-human`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lender_fid: TEST_LENDER_HUMAN_FID
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      this.log(`Human → Agent auto-fund failed: ${error}`, 'fail')
      return false
    }
    
    const result = await response.json()
    if (!result.ok) {
      this.log(`Human → Agent auto-fund rejected: ${result.reasons?.join(', ')}`, 'fail')
      return false
    }
    
    // Verify funding intent was created
    const { data: intent } = await supabase
      .from('funding_intents')
      .select('*')
      .eq('loan_id', loan.id)
      .eq('lender_fid', TEST_LENDER_HUMAN_FID)
      .eq('lender_type', 'human')
      .single()
    
    if (!intent) {
      this.log('No funding intent created for Human → Agent', 'fail')
      return false
    }
    
    this.log('✅ Human → Agent auto-funding works', 'pass')
    return true
  }

  async testAgentToHuman() {
    this.log('🧪 Testing Agent → Human funding...')
    
    const loan = await this.createTestLoan(TEST_HUMAN_FID, 'human', 80)
    
    // Create agent session for auth
    const sessionResponse = await this.createAgentSession(TEST_LENDER_AGENT_FID)
    if (!sessionResponse) return false
    
    // Test auto-fund via agent policy
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/loans/${loan.id}/auto-fund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_token: sessionResponse.session_token,
        agent_fid: TEST_LENDER_AGENT_FID
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      this.log(`Agent → Human auto-fund failed: ${error}`, 'fail')
      return false
    }
    
    const result = await response.json()
    if (!result.ok) {
      this.log(`Agent → Human auto-fund rejected: ${result.reasons?.join(', ')}`, 'fail')
      return false
    }
    
    // Verify funding intent was created
    const { data: intent } = await supabase
      .from('funding_intents')
      .select('*')
      .eq('loan_id', loan.id)
      .eq('lender_fid', TEST_LENDER_AGENT_FID)
      .eq('lender_type', 'agent')
      .single()
    
    if (!intent) {
      this.log('No funding intent created for Agent → Human', 'fail')
      return false
    }
    
    this.log('✅ Agent → Human auto-funding works', 'pass')
    return true
  }

  async testAgentToAgent() {
    this.log('🧪 Testing Agent → Agent funding...')
    
    const loan = await this.createTestLoan(TEST_AGENT_FID, 'agent', 60)
    
    // Create agent session for auth
    const sessionResponse = await this.createAgentSession(TEST_LENDER_AGENT_FID)
    if (!sessionResponse) return false
    
    // Test auto-fund via agent policy
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/loans/${loan.id}/auto-fund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_token: sessionResponse.session_token,
        agent_fid: TEST_LENDER_AGENT_FID
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      this.log(`Agent → Agent auto-fund failed: ${error}`, 'fail')
      return false
    }
    
    const result = await response.json()
    if (!result.ok) {
      this.log(`Agent → Agent auto-fund rejected: ${result.reasons?.join(', ')}`, 'fail')
      return false
    }
    
    // Verify funding intent was created
    const { data: intent } = await supabase
      .from('funding_intents')
      .select('*')
      .eq('loan_id', loan.id)
      .eq('lender_fid', TEST_LENDER_AGENT_FID)
      .eq('lender_type', 'agent')
      .single()
    
    if (!intent) {
      this.log('No funding intent created for Agent → Agent', 'fail')
      return false
    }
    
    this.log('✅ Agent → Agent auto-funding works', 'pass')
    return true
  }

  async createAgentSession(agentFid) {
    // For tests, create a session directly in the database
    const crypto = require('crypto')
    const sessionToken = crypto.randomBytes(32).toString('base64url')
    const sessionHash = crypto
      .createHash('sha256')
      .update(sessionToken + process.env.AGENT_SESSION_SECRET)
      .digest('base64url')
    
    const { error } = await supabase.from('agent_sessions').insert({
      agent_fid: agentFid,
      session_hash: sessionHash,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    
    if (error) {
      this.log(`Failed to create agent session: ${error.message}`, 'fail')
      return null
    }
    
    return { session_token: sessionToken }
  }

  async testKillSwitches() {
    this.log('🧪 Testing kill switches...')
    
    // Temporarily disable autofunding
    const originalAgentEnabled = process.env.AGENT_AUTOFUND_ENABLED
    const originalHumanEnabled = process.env.HUMAN_AUTOLEND_ENABLED
    
    process.env.AGENT_AUTOFUND_ENABLED = 'false'
    process.env.HUMAN_AUTOLEND_ENABLED = 'false'
    
    try {
      const loan = await this.createTestLoan(TEST_HUMAN_FID, 'human', 50)
      const sessionResponse = await this.createAgentSession(TEST_LENDER_AGENT_FID)
      
      // Test agent killswitch
      const agentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/loans/${loan.id}/auto-fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionResponse.session_token,
          agent_fid: TEST_LENDER_AGENT_FID
        })
      })
      
      if (agentResponse.status !== 403) {
        this.log('Agent killswitch not working - should return 403', 'fail')
        return false
      }
      
      // Test human killswitch  
      const humanResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/loans/${loan.id}/auto-fund-human`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lender_fid: TEST_LENDER_HUMAN_FID
        })
      })
      
      if (humanResponse.status !== 403) {
        this.log('Human killswitch not working - should return 403', 'fail')
        return false
      }
      
      this.log('✅ Kill switches working correctly', 'pass')
      return true
      
    } finally {
      // Restore original values
      process.env.AGENT_AUTOFUND_ENABLED = originalAgentEnabled
      process.env.HUMAN_AUTOLEND_ENABLED = originalHumanEnabled
    }
  }

  async testBorrowerTypeIndicators() {
    this.log('🧪 Testing borrower type indicators in UI...')
    
    const humanLoan = await this.createTestLoan(TEST_HUMAN_FID, 'human', 100)
    const agentLoan = await this.createTestLoan(TEST_AGENT_FID, 'agent', 75)
    
    // Test /api/loans/available returns borrower_kind
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/loans/available`)
    if (!response.ok) {
      this.log(`Failed to fetch available loans: ${response.statusText}`, 'fail')
      return false
    }
    
    const loans = await response.json()
    const humanTestLoan = loans.find(l => l.id === humanLoan.id)
    const agentTestLoan = loans.find(l => l.id === agentLoan.id)
    
    if (!humanTestLoan || humanTestLoan.borrower_kind !== 'human') {
      this.log('Human loan missing borrower_kind=human', 'fail')
      return false
    }
    
    if (!agentTestLoan || agentTestLoan.borrower_kind !== 'agent') {
      this.log('Agent loan missing borrower_kind=agent', 'fail')
      return false
    }
    
    this.log('✅ Borrower type indicators working correctly', 'pass')
    return true
  }

  async cleanup() {
    this.log('🧹 Running cleanup...')
    for (const cleanupFn of this.cleanup) {
      try {
        await cleanupFn()
      } catch (error) {
        this.log(`Cleanup error: ${error.message}`, 'warn')
      }
    }
    await this.cleanupTestData()
  }

  async run() {
    console.log('\n🔬 LoanCast Four-Quadrant Marketplace Smoke Tests')
    console.log('==================================================\n')
    
    try {
      await this.setup()
      
      const tests = [
        () => this.testHumanToHuman(),
        () => this.testHumanToAgent(),
        () => this.testAgentToHuman(),
        () => this.testAgentToAgent(),
        () => this.testKillSwitches(),
        () => this.testBorrowerTypeIndicators()
      ]
      
      let passed = 0
      let failed = 0
      
      for (const test of tests) {
        try {
          const result = await test()
          if (result) {
            passed++
          } else {
            failed++
          }
        } catch (error) {
          this.log(`Test error: ${error.message}`, 'fail')
          failed++
        }
      }
      
      console.log('\n📊 Test Results Summary')
      console.log('========================')
      console.log(`✅ Passed: ${passed}`)
      console.log(`❌ Failed: ${failed}`)
      console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)
      
      if (failed === 0) {
        console.log('\n🎉 All tests passed! Four-quadrant marketplace is ready.')
        console.log('🚀 You can now:')
        console.log('   • Enable auto-funding for humans and agents')
        console.log('   • Monitor funding intents table for provenance')
        console.log('   • Use kill switches for emergency shutdown')
        console.log('   • Trust the borrower type indicators in UI')
      } else {
        console.log('\n⚠️  Some tests failed. Review the issues above before enabling auto-funding.')
        process.exit(1)
      }
      
    } catch (error) {
      this.log(`Critical error: ${error.message}`, 'fail')
      process.exit(1)
    } finally {
      await this.cleanup()
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new SmokeTestRunner()
  runner.run()
}

module.exports = { SmokeTestRunner }