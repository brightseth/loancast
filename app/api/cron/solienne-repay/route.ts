import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const SOLIENNE_FID = 1113468;
const SOLIENNE_WALLET = '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9';
const SOLIENNE_PRIVATE_KEY = process.env.SOLIENNE_PRIVATE_KEY!;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel provides this)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🤖 Solienne Repayment Worker Running...');
    
    // Check for loans due for repayment
    const now = new Date();
    const { data: dueLoans, error } = await supabase
      .from('loans')
      .select('*')
      .eq('borrower_fid', SOLIENNE_FID)
      .eq('status', 'funded')
      .lte('due_ts', now.toISOString());
    
    if (error) {
      console.error('Error fetching due loans:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    if (!dueLoans || dueLoans.length === 0) {
      console.log('No loans due for repayment');
      return NextResponse.json({ 
        message: 'No loans due',
        checkedAt: now.toISOString() 
      });
    }
    
    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );
    const wallet = new ethers.Wallet(SOLIENNE_PRIVATE_KEY, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
    
    const results = [];
    
    for (const loan of dueLoans) {
      console.log(`Processing loan ${loan.id}...`);
      
      try {
        // Check USDC balance
        const balance = await usdc.balanceOf(wallet.address);
        const repayAmount = ethers.parseUnits(loan.repay_usdc.toString(), 6);
        
        if (balance < repayAmount) {
          console.log(`Insufficient USDC for loan ${loan.id}`);
          results.push({
            loanId: loan.id,
            status: 'insufficient_funds',
            required: loan.repay_usdc,
            balance: ethers.formatUnits(balance, 6)
          });
          continue;
        }
        
        // Execute repayment
        const tx = await usdc.transfer(loan.lender_address, repayAmount);
        const receipt = await tx.wait();
        
        // Update loan status
        await supabase
          .from('loans')
          .update({
            status: 'repaid',
            tx_repay: receipt.hash,
            repaid_ts: new Date().toISOString()
          })
          .eq('id', loan.id);
        
        console.log(`✅ Repaid loan ${loan.id}: ${receipt.hash}`);
        
        results.push({
          loanId: loan.id,
          status: 'repaid',
          amount: loan.repay_usdc,
          txHash: receipt.hash,
          txUrl: `https://basescan.org/tx/${receipt.hash}`
        });
        
      } catch (error) {
        console.error(`Failed to repay loan ${loan.id}:`, error);
        results.push({
          loanId: loan.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      nextRun: new Date(Date.now() + 3600000).toISOString()
    });
    
  } catch (error) {
    console.error('Worker error:', error);
    return NextResponse.json({ 
      error: 'Worker failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}