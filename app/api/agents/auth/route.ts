import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyMessage } from "viem";
import { Strategy } from "@/lib/agent/policy";
import { newSessionToken, storeSession } from "@/lib/agent/session";
import { createServerClient } from "@/lib/supabase";
import { createHash } from "node:crypto";

const Body = z.object({
  agent_fid: z.number().int(),
  controller_fid: z.number().int(),
  wallet: z.string(),
  agent_type: z.enum(['yield','arb','lp','reputation','maker']),
  strategy: Strategy,
  policy: z.object({
    daily_usdc_cap: z.number().int().nonnegative().default(1000),
    per_tx_cap: z.number().int().nonnegative().default(700),
    per_counterparty_cap: z.number().int().nonnegative().default(500),
    allow_autofund: z.boolean().default(true),
  }),
  manifest_signature: z.string(),  // EIP-191 signature by wallet over packed manifest string
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const b = Body.parse(json);

  const manifest = JSON.stringify({
    agent_fid: b.agent_fid, controller_fid: b.controller_fid, wallet: b.wallet,
    strategy_hash: createHash("sha256").update(JSON.stringify(b.strategy)).digest("hex"),
    policy: b.policy
  });

  const ok = await verifyMessage({ address: b.wallet as `0x${string}`, message: manifest, signature: b.manifest_signature as `0x${string}` })
                 .catch(() => false);
  if (!ok) return new Response(JSON.stringify({ error: "bad_signature" }), { status: 401 });

  const db = createServerClient();

  const strategy_hash = createHash("sha256").update(JSON.stringify(b.strategy)).digest("hex");
  const agentRow = {
    agent_fid: b.agent_fid, controller_fid: b.controller_fid, wallet: b.wallet,
    agent_type: b.agent_type, strategy: b.strategy, strategy_hash, policy: b.policy,
    verified_at: new Date().toISOString(), active: true
  };
  await db.from("agents").upsert(agentRow).eq("agent_fid", b.agent_fid);
  await db.from("agent_limits").insert({ agent_fid: b.agent_fid }).onConflict('agent_fid').ignore();

  const { token, hash } = newSessionToken();
  const expires_at = await storeSession(b.agent_fid, hash, 24);

  return Response.json({ session_token: token, expires_at, policy: b.policy, strategy_hash });
}