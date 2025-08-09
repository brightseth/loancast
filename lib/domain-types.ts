import { z } from 'zod'

// Domain Types - Single source of truth for business logic
export type LoanStatus = 'seeking' | 'funded' | 'due' | 'overdue' | 'default' | 'repaid' | 'cancelled' | 'deleted'

export type NotificationKind = 
  | 'reminder_3d' 
  | 'reminder_1d' 
  | 'due_today'
  | 'overdue'
  | 'funded'
  | 'repaid'
  | 'defaulted'

// Money handling with bigint precision (USDC has 6 decimals)
export const USDC_DECIMALS = 6
export const USDC_UNIT = BigInt(10 ** USDC_DECIMALS) // 1,000,000

// Enhanced money helpers - all USDC operations in 6-decimal precision
export function usdc(amount: string | number): bigint {
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[,$\s]/g, '')
    if (!/^\d+(\.\d{1,6})?$/.test(cleaned)) {
      throw new Error(`Invalid USDC amount format: ${amount}`)
    }
    
    if (cleaned.includes('.')) {
      const [whole, decimal] = cleaned.split('.')
      const paddedDecimal = decimal.padEnd(6, '0').slice(0, 6)
      return BigInt(whole) * USDC_UNIT + BigInt(paddedDecimal)
    }
    return BigInt(cleaned) * USDC_UNIT
  }
  return BigInt(Math.floor(amount * Number(USDC_UNIT)))
}

export function usdcToWei(usdc: number): bigint {
  return BigInt(Math.floor(usdc * Number(USDC_UNIT)))
}

export function weiToUsdc(wei: bigint): number {
  return Number(wei) / Number(USDC_UNIT)
}

export function formatUsdc(wei: bigint, decimals: number = 2): string {
  const usdcAmount = weiToUsdc(wei)
  return usdcAmount.toFixed(decimals)
}

// Interest calculation with precise math
export function calculateRepayment(principal: bigint, monthlyRateBps: number = 200): bigint {
  // 200 bps = 2% = 0.02
  // repayment = principal * (10000 + rate_bps) / 10000
  return (principal * BigInt(10000 + monthlyRateBps)) / BigInt(10000)
}

// Loan state machine
export function canTransition(from: LoanStatus, to: LoanStatus): boolean {
  const validTransitions: Record<LoanStatus, LoanStatus[]> = {
    seeking: ['funded', 'cancelled', 'deleted'],
    funded: ['due', 'repaid', 'overdue'],
    due: ['repaid', 'overdue'],
    overdue: ['repaid', 'default'],
    default: [], // Terminal state
    repaid: [], // Terminal state
    cancelled: [], // Terminal state
    deleted: [] // Terminal state
  }
  
  return validTransitions[from]?.includes(to) ?? false
}

// Zod Schemas for API validation
export const CreateLoanSchema = z.object({
  amount: z.number().min(1).max(10000), // $1 to $10,000
  durationMonths: z.number().int().min(1).max(12), // 1-12 months
  purpose: z.string().min(10).max(500),
  borrowerFid: z.number().int().positive()
})

export const FundLoanSchema = z.object({
  loanId: z.string().uuid(),
  lenderFid: z.number().int().positive(),
  lenderAddr: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // Ethereum address
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/) // Transaction hash
})

export const RepaymentInitSchema = z.object({
  loanId: z.string().uuid(),
  borrowerAddr: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  lenderAddr: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  expectedAmount: z.string() // BigInt as string
})

export const RepaymentConfirmSchema = z.object({
  loanId: z.string().uuid(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  fromAddr: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  toAddr: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(), // BigInt as string
  blockNumber: z.number().int().positive()
})

export const WebhookSchema = z.object({
  type: z.enum(['cast.created', 'cast.deleted', 'reaction.created', 'cast.collected']),
  data: z.record(z.any()) // Flexible for different webhook types
})

// Constants
export const BASE_CHAIN_ID = 8453
export const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const DEFAULT_MONTHLY_RATE_BPS = 200 // 2%
export const MAX_LOAN_DURATION_DAYS = 90
export const MIN_LOAN_AMOUNT_USDC = usdc('1') // $1 minimum
export const MAX_LOAN_AMOUNT_USDC = usdc('10000') // $10k maximum

// Domain Models - Updated with new required fields
export interface Loan {
  id: string
  loan_number: number
  cast_hash?: string
  origin_cast_hash?: string // NEW: for repayment verification
  borrower_fid: number
  lender_fid?: number
  borrower_addr?: string // NEW: for repayment verification
  lender_addr?: string // NEW: for repayment verification
  amount_usdc: string // Changed to string (bigint serialized)
  repay_expected_usdc?: string // NEW: exact repayment amount as string
  rate_bps: number
  status: LoanStatus
  description?: string
  due_ts: string
  fund_tx_hash?: string
  repay_tx_hash?: string
  verified_funding: boolean
  verified_repayment: boolean
  created_at: string
  updated_at: string
}

export interface Repayment {
  id: string
  loan_id: string
  tx_hash: string
  from_addr: string
  to_addr: string
  amount_usdc: bigint
  block_number: number
  verified: boolean
  created_at: string
}

export interface StatusTransition {
  id: string
  loan_id: string
  from_status: LoanStatus
  to_status: LoanStatus
  reason?: string
  triggered_by: string
  metadata?: Record<string, any>
  created_at: string
}

export interface ReputationEvent {
  id: string
  fid: number
  delta: number
  reason: string
  loan_id?: string
  metadata?: Record<string, any>
  created_at: string
}

// Error types
export class LoanError extends Error {
  constructor(
    message: string,
    public code: string,
    public loanId?: string
  ) {
    super(message)
    this.name = 'LoanError'
  }
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public txHash?: string
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

// Result type for error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export function success<T>(data: T): Result<T> {
  return { success: true, data }
}

export function failure<E extends Error>(error: E): Result<never, E> {
  return { success: false, error }
}