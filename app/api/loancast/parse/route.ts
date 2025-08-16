import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Parser regex for /loancast syntax
const LOANCAST_REGEX = /^\/loancast\s+borrow\s+([0-9]+(?:\.[0-9]{1,2})?)\s+for\s+([0-9]{1,2})d\s+@\s*2%\/mo\s+—\s*"([^"]+)"$/;

const MAX_AMOUNT = 100;
const MAX_DAYS = 30;
const MONTHLY_RATE = 0.02;
const SOLIENNE_FID = 1113468;
const SOLIENNE_WALLET = '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { text, fid } = await req.json();
    
    // Only allow Solienne for now
    if (fid !== SOLIENNE_FID) {
      return NextResponse.json({
        error: 'Only Solienne (FID 1113468) can create loans via cast'
      }, { status: 403 });
    }
    
    // Parse the cast text
    const match = text.match(LOANCAST_REGEX);
    
    if (!match) {
      return NextResponse.json({
        error: 'Invalid format',
        example: '/loancast borrow 50 for 7d @ 2%/mo — "purpose"'
      }, { status: 400 });
    }
    
    const amount = parseFloat(match[1]);
    const days = parseInt(match[2]);
    const memo = match[3];
    
    // Validate amount
    if (amount <= 0 || amount > MAX_AMOUNT) {
      return NextResponse.json({
        error: `Amount must be between 0.01 and ${MAX_AMOUNT} USDC`
      }, { status: 400 });
    }
    
    // Validate days
    if (days < 1 || days > MAX_DAYS) {
      return NextResponse.json({
        error: `Duration must be between 1 and ${MAX_DAYS} days`
      }, { status: 400 });
    }
    
    // Check for existing active loans
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('id')
      .eq('borrower_fid', SOLIENNE_FID)
      .in('status', ['seeking', 'funded'])
      .limit(1);
    
    if (activeLoans && activeLoans.length > 0) {
      return NextResponse.json({
        error: 'Solienne already has an active loan. One loan at a time.'
      }, { status: 400 });
    }
    
    // Calculate repayment
    const interest = amount * MONTHLY_RATE * (days / 30);
    const repayAmount = Math.round((amount + interest) * 100) / 100;
    
    // Create the loan
    const loanId = crypto.randomUUID();
    const now = new Date();
    const dueDate = new Date(now.getTime() + days * 86400 * 1000);
    
    const loan = {
      id: loanId,
      cast_hash: `solienne_cast_${Date.now()}`,
      borrower_fid: SOLIENNE_FID,
      borrower_type: 'agent',
      gross_usdc: amount,
      net_usdc: amount,
      yield_bps: 0, // We use pricing_policy instead
      repay_usdc: repayAmount,
      start_ts: now.toISOString(),
      due_ts: dueDate.toISOString(),
      status: 'seeking',
      loan_number: 400000 + Math.floor(Math.random() * 1000),
      description: memo,
      requested_usdc: amount,
      pricing_policy: 'flat_2pct_month',
      source: 'farcaster_cast',
      borrower_wallet: SOLIENNE_WALLET
    };
    
    const { data, error } = await supabase
      .from('loans')
      .insert(loan)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create loan:', error);
      return NextResponse.json({
        error: 'Failed to create loan'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      loan: {
        id: data.id,
        amount: amount,
        days: days,
        memo: memo,
        interest: Math.round(interest * 100) / 100,
        repayAmount: repayAmount,
        rate: '2%/mo',
        dueDate: dueDate.toISOString(),
        collectUrl: `https://loancast.app/loans/${data.id}`
      },
      message: `Loan created! Collectors can fund ${amount} USDC to Solienne.`
    });
    
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({
      error: 'Failed to parse loan request'
    }, { status: 500 });
  }
}