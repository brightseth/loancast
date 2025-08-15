import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { evaluateFundingPolicy } from "@/lib/agent/policy";
import { getHumanSession } from "@/lib/auth/humanSession";
import { observability, logInfo, logError } from "@/lib/observability";

const Body = z.object({ fid: z.number().int() }); // fallback if you prefer explicit body

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (process.env.HUMAN_AUTOLEND_ENABLED !== "true")
    return new Response("killswitch", { status: 403 });

  const db = createServerClient();

  // Resolve human identity
  const sess = await getHumanSession(req).catch(() => null);
  const b = Body.safeParse(await req.json().catch(() => ({})));
  const human_fid = sess?.fid ?? (b.success ? b.data.fid : null);
  if (!human_fid) return new Response("unauthorized", { status: 401 });

  // Load prefs
  const { data: prefs } = await db.from("human_autolend_prefs").select("*").eq("lender_fid", human_fid).single();
  if (!prefs?.active) return new Response("autolend_disabled", { status: 403 });

  // Load loan & borrower score/kind
  const { data: loan } = await db.from("loans")
    .select("id, borrower_fid, borrower_type, principal_usdc_6, duration_days, status, created_at")
    .eq("id", params.id).single();
  if (!loan || loan.status !== "seeking") return new Response("not_seekable", { status: 400 });

  let borrowerScore = 0;
  if (loan.borrower_type === 'human') {
    const s = await db.from("borrower_stats").select("score").eq("fid", loan.borrower_fid).single();
    borrowerScore = s.data?.score ?? 0;
  } else {
    const s = await db.from("agent_stats").select("score").eq("agent_fid", loan.borrower_fid).single();
    borrowerScore = s.data?.score ?? 0;
  }

  // Velocity counters (last 24h)
  const sinceIso = new Date(Date.now() - 24*3600e3).toISOString();
  const fundedToday = await db.from("funding_intents")
    .select("id").eq("lender_fid", human_fid).eq("lender_type",'human')
    .gte("created_at", sinceIso);
  // Sum spend via repayments/fund txs later; in P1, approximate to intent amounts
  const todaySpend_6 = 0n; // TODO: compute from actual funding source if available

  // Fairness caps - check how much this borrower has received today from all lenders
  const borrowerTodayFunding = await db.from("funding_intents")
    .select("loan_id")
    .gte("created_at", sinceIso);
    
  let borrowerDailyLoans = 0;
  let borrowerDailyAmount_6 = 0n;
  
  if (borrowerTodayFunding.data) {
    const loanIds = borrowerTodayFunding.data.map(f => f.loan_id);
    if (loanIds.length > 0) {
      const borrowerLoans = await db.from("loans")
        .select("borrower_fid, principal_usdc_6")
        .eq("borrower_fid", loan.borrower_fid)
        .in("id", loanIds);
        
      if (borrowerLoans.data) {
        borrowerDailyLoans = borrowerLoans.data.length;
        borrowerDailyAmount_6 = borrowerLoans.data.reduce(
          (sum, l) => sum + BigInt(l.principal_usdc_6), 
          0n
        );
      }
    }
  }

  const decision = evaluateFundingPolicy(
    {
      id: loan.id,
      amount_usdc_6: BigInt(loan.principal_usdc_6),
      duration_days: loan.duration_days,
      borrower_fid: String(loan.borrower_fid),
      borrower_kind: loan.borrower_type as 'human'|'agent',
      borrower_score: borrowerScore,
      created_at: loan.created_at
    },
    {
      lenderKind: 'human',
      allowKinds: (prefs.allow_human && prefs.allow_agent) ? 'both' : 
                  (prefs.allow_human ? 'human' : 
                  (prefs.allow_agent ? 'agent' : 'none')),
      minScore: prefs.min_score ?? 0,
      maxAmount_6: BigInt((prefs.max_amount_usdc ?? 100) * 1e6),
      preferredDuration: [prefs.max_duration_days ?? 30],
      limits: {
        max_loans_per_day: 10,   // simple default; tune as needed
        max_usdc_per_day_6: BigInt((prefs.daily_limit_usdc ?? 500) * 1e6),
        max_usdc_per_tx_6: BigInt((prefs.max_amount_usdc ?? 100) * 1e6),
        per_counterparty_day_6: BigInt((prefs.per_borrower_limit_usdc ?? 100) * 1e6)
      },
      todayLoans: fundedToday.data?.length ?? 0,
      todaySpend_6,
      todayCounterparty_6: 0n,  // TODO: compute
      allowAutoFund: true,
      holdbackWindowMinutes: 15,  // Give manual funders 15 minutes first
      fairnessCaps: {
        maxLoansPerBorrowerPerDay: 3,  // No single borrower can get more than 3 loans per day
        maxAmountPerBorrowerPerDay_6: BigInt(1000 * 1e6),  // No single borrower can get more than $1000 per day
        borrowerDailyLoans,
        borrowerDailyAmount_6
      }
    }
  );

  // Log policy evaluation
  await observability.logPolicyEvaluation(
    loan.id,
    human_fid,
    'human',
    decision.ok,
    decision.reasons,
    {
      borrower_type: loan.borrower_type,
      amount_usdc_6: loan.principal_usdc_6.toString(),
      duration_days: loan.duration_days,
      borrower_score: borrowerScore
    }
  ).catch(err => logError('Failed to log policy evaluation', err));

  if (!decision.ok) {
    // Log rejection
    await observability.logHumanAutofundRejected(
      loan.id,
      human_fid,
      loan.borrower_fid,
      loan.borrower_type as 'human' | 'agent',
      decision.reasons
    ).catch(err => logError('Failed to log autofund rejection', err));
    
    return Response.json({ ok:false, reasons: decision.reasons }, { status: 403 });
  }

  // Record intent; actual funding uses your existing rails (collect/USDC transfer)
  await db.from("funding_intents").insert({
    loan_id: loan.id,
    lender_fid: human_fid,
    lender_type: 'human'
  });

  // Log successful auto-fund
  await observability.logHumanAutofundAccepted(
    loan.id,
    human_fid,
    loan.borrower_fid,
    loan.borrower_type as 'human' | 'agent',
    BigInt(loan.principal_usdc_6)
  ).catch(err => logError('Failed to log autofund acceptance', err));

  logInfo('Human auto-fund accepted', {
    loan_id: loan.id,
    lender_fid: human_fid,
    borrower_fid: loan.borrower_fid,
    borrower_type: loan.borrower_type,
    amount_usdc: Number(loan.principal_usdc_6) / 1e6
  });

  return Response.json({ ok:true, status:"accepted", reasons: decision.reasons });
}