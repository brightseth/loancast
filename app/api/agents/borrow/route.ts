import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Known agents registry
const KNOWN_AGENTS = {
  1113468: { name: 'Solienne', creator: 'Eden.art' },
  193435: { name: 'Aethernet', creator: 'Higher' },
  247144: { name: 'MferGPT', creator: 'mfer community' },
  295867: { name: 'Gina', creator: '@askgina.eth' },
  207315: { name: 'Yoinker', creator: '@yoink' },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate agent
    const { agent_fid, amount_usdc, duration_days, purpose, signature } = body
    
    if (!KNOWN_AGENTS[agent_fid]) {
      return NextResponse.json({
        error: 'Agent not recognized',
        message: 'Please register your agent first'
      }, { status: 400 })
    }
    
    // Basic validation
    if (!amount_usdc || amount_usdc < 1 || amount_usdc > 1000) {
      return NextResponse.json({
        error: 'Invalid amount',
        message: 'Amount must be between 1-1000 USDC'
      }, { status: 400 })
    }
    
    if (!duration_days || duration_days < 1 || duration_days > 30) {
      return NextResponse.json({
        error: 'Invalid duration',
        message: 'Duration must be between 1-30 days'
      }, { status: 400 })
    }
    
    // Check for existing active loans
    const { data: existingLoans } = await supabase
      .from('loans')
      .select('id, status')
      .eq('borrower_fid', agent_fid)
      .in('status', ['seeking', 'funded'])
    
    if (existingLoans && existingLoans.length > 0) {
      return NextResponse.json({
        error: 'Active loan exists',
        message: 'Please repay existing loan before borrowing again'
      }, { status: 400 })
    }
    
    // Calculate repayment amount (2% monthly, pro-rated)
    const monthlyRate = 0.02
    const dailyRate = monthlyRate / 30
    const totalInterest = amount_usdc * dailyRate * duration_days
    const repayAmount = amount_usdc + totalInterest
    
    // Create loan
    const loanId = uuidv4()
    const now = new Date()
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + duration_days)
    
    const loan = {
      id: loanId,
      cast_hash: `agent_api_${Date.now()}`, // Unique identifier for API loans
      borrower_fid: agent_fid,
      borrower_type: 'agent',
      gross_usdc: amount_usdc,
      net_usdc: amount_usdc,
      yield_bps: 0, // Using fixed rate instead
      repay_usdc: Number(repayAmount.toFixed(2)),
      start_ts: now.toISOString(),
      due_ts: dueDate.toISOString(),
      status: 'seeking',
      description: purpose || 'Agent-initiated loan',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }
    
    const { data: createdLoan, error } = await supabase
      .from('loans')
      .insert(loan)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating loan:', error)
      return NextResponse.json({
        error: 'Failed to create loan'
      }, { status: 500 })
    }
    
    // Log API usage
    console.log(`[Agent API] Loan created for ${KNOWN_AGENTS[agent_fid].name} (${agent_fid}): ${amount_usdc} USDC for ${duration_days} days`)
    
    return NextResponse.json({
      success: true,
      loan: {
        id: createdLoan.id,
        amount: amount_usdc,
        duration_days,
        repay_amount: repayAmount.toFixed(2),
        due_date: dueDate.toISOString(),
        status: 'seeking',
        url: `https://loancast.app/loans/${createdLoan.id}`
      },
      message: `Loan request created for ${KNOWN_AGENTS[agent_fid].name}. Auction starts now!`
    })
    
  } catch (error) {
    console.error('Agent borrow API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Agent Borrowing API',
    version: '1.0',
    endpoints: {
      'POST /api/agents/borrow': 'Create a loan request',
      'GET /api/agents/status': 'Check agent status',
      'GET /api/agents/loans': 'List agent loans'
    },
    example: {
      agent_fid: 1113468,
      amount_usdc: 100,
      duration_days: 7,
      purpose: 'Compute costs for image generation'
    },
    known_agents: Object.entries(KNOWN_AGENTS).map(([fid, info]) => ({
      fid: Number(fid),
      ...info
    }))
  })
}