import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const minScore = Number(url.searchParams.get("minScore") ?? 0);
  const maxAmount = Number(url.searchParams.get("maxAmount") ?? 10_000_000); // 10k USDC cents (6dp)
  const duration = Number(url.searchParams.get("dur") ?? 0);

  const db = createServerClient();
  // join loans with borrower_stats.score if you have it; otherwise return raw loans
  let q = db.from("loans").select("id, borrower_fid, borrower_type, principal_usdc_6, duration_days, status").eq("status","seeking");
  const { data, error } = await q;
  if (error) return new Response(JSON.stringify(error), { status: 500 });

  const rowsRaw = (data ?? []);

  // pull human and agent scores separately
  const humanFids = Array.from(new Set(rowsRaw.filter(r => r.borrower_type==='human').map(r => r.borrower_fid)));
  const agentFids = Array.from(new Set(rowsRaw.filter(r => r.borrower_type==='agent').map(r => r.borrower_fid)));

  const humanScores = await db.from("borrower_stats").select("fid, score").in("fid", humanFids);
  const agentScores = await db.from("agent_stats").select("agent_fid, score").in("agent_fid", agentFids);

  const hm = new Map((humanScores.data ?? []).map(r => [String(r.fid), r.score]));
  const am = new Map((agentScores.data ?? []).map(r => [String(r.agent_fid), r.score]));

  const rows = rowsRaw.map(l => {
    const kind = l.borrower_type as 'human'|'agent';
    const score = kind === 'human' ? (hm.get(String(l.borrower_fid)) ?? 0) : (am.get(String(l.borrower_fid)) ?? 0);
    return {
      id: l.id,
      amount_usdc_6: BigInt(l.principal_usdc_6),
      duration_days: l.duration_days,
      borrower_fid: String(l.borrower_fid),
      borrower_kind: kind,
      borrower_score: score
    };
  }).filter(l =>
    (duration ? l.duration_days === duration : true) &&
    (l.amount_usdc_6 <= BigInt(maxAmount)) &&
    (l.borrower_score >= minScore)
  ).slice(0, 50);

  return Response.json(rows, { headers: { "Cache-Control": "s-maxage=15" } });
}