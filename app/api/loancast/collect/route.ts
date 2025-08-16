import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

export async function POST(req: NextRequest) {
  try {
    const { 
      loanId, 
      lenderFid, 
      lenderWallet,
      lenderPrivateKey // In production, use delegated approval instead
    } = await req.json();
    
    // Fetch loan
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();
    
    if (loanError || !loan) {
      return NextResponse.json({
        error: 'Loan not found'
      }, { status: 404 });
    }
    
    if (loan.status !== 'seeking') {
      return NextResponse.json({
        error: 'Loan is not seeking funding'
      }, { status: 400 });
    }
    
    // Get borrower wallet (Solienne)
    const borrowerWallet = loan.borrower_wallet || '0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9';
    
    // Record funding intent
    await supabase
      .from('funding_intents')
      .insert({
        loan_id: loanId,
        lender_fid: lenderFid,
        lender_type: 'human'
      });
    
    // Execute on-chain transfer
    if (lenderPrivateKey) {
      try {
        const provider = new ethers.JsonRpcProvider(
          process.env.BASE_RPC_URL || 'https://mainnet.base.org'
        );
        const wallet = new ethers.Wallet(lenderPrivateKey, provider);
        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
        
        // Check balance
        const balance = await usdc.balanceOf(wallet.address);
        const amount = ethers.parseUnits(loan.gross_usdc.toString(), 6);
        
        if (balance < amount) {
          return NextResponse.json({
            error: 'Insufficient USDC balance'
          }, { status: 400 });
        }
        
        // Transfer USDC
        const tx = await usdc.transfer(borrowerWallet, amount);
        const receipt = await tx.wait();
        
        // Update loan status
        await supabase
          .from('loans')
          .update({
            status: 'funded',
            lender_fid: lenderFid,
            lender_type: 'human',
            lender_address: wallet.address,
            tx_fund: receipt.hash,
            funded_at: new Date().toISOString()
          })
          .eq('id', loanId);
        
        return NextResponse.json({
          success: true,
          message: `Funded ${loan.gross_usdc} USDC to Solienne`,
          txHash: receipt.hash,
          txUrl: `https://basescan.org/tx/${receipt.hash}`,
          loan: {
            id: loanId,
            amount: loan.gross_usdc,
            dueDate: loan.due_ts,
            expectedRepayment: loan.repay_usdc
          }
        });
        
      } catch (error) {
        console.error('Transfer failed:', error);
        return NextResponse.json({
          error: 'Transfer failed'
        }, { status: 500 });
      }
    } else {
      // Manual funding flow (for frame/UI)
      return NextResponse.json({
        success: true,
        pendingTransfer: {
          to: borrowerWallet,
          amount: loan.gross_usdc,
          memo: `Fund loan ${loanId}`
        },
        message: `Send ${loan.gross_usdc} USDC to ${borrowerWallet}`,
        loan: {
          id: loanId,
          amount: loan.gross_usdc,
          dueDate: loan.due_ts,
          expectedRepayment: loan.repay_usdc
        }
      });
    }
    
  } catch (error) {
    console.error('Collect error:', error);
    return NextResponse.json({
      error: 'Failed to process collection'
    }, { status: 500 });
  }
}