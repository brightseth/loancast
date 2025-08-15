import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { getSession } from "@/lib/agent/session";
import { evaluatePolicy } from "@/lib/agent/policy";
import { observability, logInfo, logError } from "@/lib/observability";

const Body = z.object({ session_token: z.string(), agent_fid: z.number().int() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (process.env.AGENT_AUTOFUND_ENABLED !== "true") return new Response("killswitch", { status: 403 });

  const body = Body.parse(await req.json());
  const sess = await getSession(body.session_token);
  if (!sess || Number(sess.agent_fid) !== body.agent_fid) return new Response("unauthorized", { status: 401 });

  const db = createServerClient();
  const { data: agent } = await db.from("agents").select("*").eq("agent_fid", body.agent_fid).single();
  if (!agent?.active) return new Response("agent_inactive", { status: 403 });

  // fetch loan & borrower score/kind
  const { data: loan } = await db.from("loans").select("id, borrower_fid, borrower_type, principal_usdc_6, duration_days, status, created_at").eq("id", params.id).single();
  if (!loan || loan.status !== "seeking") return new Response("not_seekable", { status: 400 });

  let borrowerScore = 0;
  if (loan.borrower_type === 'human') {
    const s = await db.from("borrower_stats").select("score").eq("fid", loan.borrower_fid).single();
    borrowerScore = s.data?.score ?? 0;
  } else {
    const s = await db.from("agent_stats").select("score").eq("agent_fid", loan.borrower_fid).single();
    borrowerScore = s.data?.score ?? 0;
  }

  // gather velocity counters cheaply (P1: last 24h queries)
  const sinceIso = new Date(Date.now()-24*3600e3).toISOString();
  const fundedToday = await db.from("agent_loans").select("id, loan_id").eq("lender_agent_fid", body.agent_fid).gte("created_at", sinceIso);
  const spendToday = await db.rpc("sum_agent_spend_last24h", { p_agent_fid: body.agent_fid }).single().catch(()=>({ data: { sum: 0 }}));

  const limits = {
    max_loans_per_day: agent.policy?.daily_loan_limit ?? 10,
    max_usdc_per_day_6: BigInt((agent.policy?.daily_usdc_cap ?? 1000) * 1e6),
    max_usdc_per_tx_6: BigInt((agent.policy?.per_tx_cap ?? 700) * 1e6),
    per_counterparty_day_6: BigInt((agent.policy?.per_counterparty_cap ?? 500) * 1e6),
  };

  const decision = evaluatePolicy({
    id: loan.id,
    amount_usdc_6: BigInt(loan.principal_usdc_6),
    duration_days: loan.duration_days,
    borrower_fid: String(loan.borrower_fid),
    borrower_kind: loan.borrower_type as 'human'|'agent',
    borrower_score: borrowerScore,
    created_at: loan.created_at
  }, {
    strategy: agent.strategy,
    limits,
    todayLoans: fundedToday.data?.length ?? 0,
    todaySpend_6: BigInt(spendToday.data?.sum ?? 0),
    todayCounterparty_6: 0n,
    allowAutoFund: true
  });

  // Log policy evaluation
  await observability.logPolicyEvaluation(
    loan.id,
    body.agent_fid,
    'agent',
    decision.ok,
    decision.reasons,
    {
      borrower_type: loan.borrower_type,
      amount_usdc_6: loan.principal_usdc_6.toString(),
      duration_days: loan.duration_days,
      borrower_score: borrowerScore,
      agent_strategy: agent.strategy
    }
  ).catch(err => logError('Failed to log agent policy evaluation', err));

  if (!decision.ok) {
    // Log rejection
    await observability.logAgentAutofundRejected(
      loan.id,
      body.agent_fid,
      loan.borrower_fid,
      loan.borrower_type as 'human' | 'agent',
      decision.reasons
    ).catch(err => logError('Failed to log agent autofund rejection', err));
    
    return Response.json({ ok:false, reasons: decision.reasons }, { status: 403 });
  }

  // TODO: call funding adapter (Zora/collect or direct USDC transfer)
  // For P1, mark intent and let existing funding flow complete.
  await db.from("funding_intents").insert({ 
    loan_id: loan.id, 
    lender_fid: body.agent_fid, 
    lender_type: 'agent' 
  });

  // Log successful auto-fund
  await observability.logAgentAutofundAccepted(
    loan.id,
    body.agent_fid,
    loan.borrower_fid,
    loan.borrower_type as 'human' | 'agent',
    BigInt(loan.principal_usdc_6)
  ).catch(err => logError('Failed to log agent autofund acceptance', err));

  logInfo('Agent auto-fund accepted', {
    loan_id: loan.id,
    agent_fid: body.agent_fid,
    borrower_fid: loan.borrower_fid,
    borrower_type: loan.borrower_type,
    amount_usdc: Number(loan.principal_usdc_6) / 1e6
  });

  return Response.json({ ok:true, status: "accepted", reasons: decision.reasons });
}