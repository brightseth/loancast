import { z } from "zod";

export const Strategy = z.object({
  riskTolerance: z.enum(['conservative','moderate','aggressive']),
  maxLoanAmount: z.number().int().nonnegative(),
  minCreditScore: z.number().int().min(0).max(900),
  preferredDuration: z.array(z.number().int().positive()).default([7,14,30]),
  blacklistedAgents: z.array(z.string()).default([]),
  whitelistedAgents: z.array(z.string()).default([]),
});
export type Strategy = z.infer<typeof Strategy>;

export type Counterparty = 'human'|'agent';

export type FundingLimits = {
  max_loans_per_day: number;
  max_usdc_per_day_6: bigint;
  max_usdc_per_tx_6: bigint;
  per_counterparty_day_6: bigint;
};

export type LoanOpportunity = {
  id: string;
  amount_usdc_6: bigint;
  duration_days: number;
  borrower_fid: string;
  borrower_kind: Counterparty;
  borrower_score?: number;  // 0..900
  created_at?: string;  // ISO timestamp for holdback window calculation
};

export type FundingContext = {
  lenderKind: Counterparty;
  allowKinds: 'human'|'agent'|'both';
  minScore: number;
  maxAmount_6: bigint;
  preferredDuration: number[];
  limits: FundingLimits;
  todayLoans: number;
  todaySpend_6: bigint;
  todayCounterparty_6: bigint;
  allowAutoFund: boolean;
  whitelist?: string[];
  denylist?: string[];
  holdbackWindowMinutes?: number;  // Minutes to wait before auto-funding to allow manual funding first
  fairnessCaps?: {
    maxLoansPerBorrowerPerDay?: number;
    maxAmountPerBorrowerPerDay_6?: bigint;
    borrowerDailyLoans?: number;  // How many loans this borrower has received today across all lenders
    borrowerDailyAmount_6?: bigint;  // How much this borrower has received today across all lenders
  };
};

export type PolicyDecision =
  | { ok: true; reasons: string[] }
  | { ok: false; reasons: string[] };

export function evaluateFundingPolicy(loan: LoanOpportunity, ctx: FundingContext): PolicyDecision {
  const reasons: string[] = [];
  if (!ctx.allowAutoFund) return { ok: false, reasons: ['global_killswitch'] };

  // Check holdback window - give manual funders time to fund first
  if (ctx.holdbackWindowMinutes && loan.created_at) {
    const loanCreatedAt = new Date(loan.created_at).getTime();
    const now = Date.now();
    const holdbackMs = ctx.holdbackWindowMinutes * 60 * 1000;
    
    if (now - loanCreatedAt < holdbackMs) {
      const remainingMinutes = Math.ceil((holdbackMs - (now - loanCreatedAt)) / (60 * 1000));
      reasons.push(`holdback_window_active_${remainingMinutes}min`);
    }
  }

  if (ctx.allowKinds !== 'both' && ctx.allowKinds !== loan.borrower_kind)
    reasons.push('counterparty_not_allowed');

  if (loan.borrower_score !== undefined && loan.borrower_score < ctx.minScore)
    reasons.push('score_below_min');

  if (loan.amount_usdc_6 > ctx.maxAmount_6)
    reasons.push('amount_above_max');

  if (!ctx.preferredDuration.includes(loan.duration_days))
    reasons.push('duration_not_preferred');

  const id = loan.borrower_fid; // use agent_fid when present; unify upstream
  if (ctx.whitelist?.length && !ctx.whitelist.includes(id)) reasons.push('not_in_allowlist');
  if (ctx.denylist?.includes(id)) reasons.push('in_denylist');

  if (ctx.todayLoans >= ctx.limits.max_loans_per_day) reasons.push('daily_loan_limit');
  if (loan.amount_usdc_6 > ctx.limits.max_usdc_per_tx_6) reasons.push('tx_cap_exceeded');
  if (ctx.todaySpend_6 + loan.amount_usdc_6 > ctx.limits.max_usdc_per_day_6) reasons.push('daily_spend_limit');
  if (ctx.todayCounterparty_6 + loan.amount_usdc_6 > ctx.limits.per_counterparty_day_6) reasons.push('counterparty_daily_limit');

  // Check fairness caps - prevent any single borrower from getting too much funding per day
  if (ctx.fairnessCaps) {
    const caps = ctx.fairnessCaps;
    
    if (caps.maxLoansPerBorrowerPerDay && caps.borrowerDailyLoans !== undefined) {
      if (caps.borrowerDailyLoans >= caps.maxLoansPerBorrowerPerDay) {
        reasons.push('borrower_daily_loan_limit_exceeded');
      }
    }
    
    if (caps.maxAmountPerBorrowerPerDay_6 && caps.borrowerDailyAmount_6 !== undefined) {
      if (caps.borrowerDailyAmount_6 + loan.amount_usdc_6 > caps.maxAmountPerBorrowerPerDay_6) {
        reasons.push('borrower_daily_amount_limit_exceeded');
      }
    }
  }

  return reasons.length ? { ok:false, reasons } : { ok:true, reasons:['pass'] };
}

// Legacy function for backward compatibility - maps to new unified policy
export type AgentLimits = FundingLimits;

export type PolicyContext = {
  strategy: Strategy;
  limits: AgentLimits;
  todayLoans: number;
  todaySpend_6: bigint;
  todayCounterparty_6: bigint;
  allowAutoFund: boolean;
};

export function evaluatePolicy(loan: LoanOpportunity, ctx: PolicyContext): PolicyDecision {
  return evaluateFundingPolicy(loan, {
    lenderKind: 'agent',
    allowKinds: 'both', // agents can fund both by default
    minScore: ctx.strategy.minCreditScore,
    maxAmount_6: BigInt(ctx.strategy.maxLoanAmount * 1e6),
    preferredDuration: ctx.strategy.preferredDuration,
    limits: ctx.limits,
    todayLoans: ctx.todayLoans,
    todaySpend_6: ctx.todaySpend_6,
    todayCounterparty_6: ctx.todayCounterparty_6,
    allowAutoFund: ctx.allowAutoFund,
    whitelist: ctx.strategy.whitelistedAgents,
    denylist: ctx.strategy.blacklistedAgents,
  });
}