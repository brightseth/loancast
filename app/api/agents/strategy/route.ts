import { NextRequest } from "next/server";
import { z } from "zod";
import { Strategy } from "@/lib/agent/policy";
import { createServerClient } from "@/lib/supabase";
import { getSession } from "@/lib/agent/session";
import { createHash } from "node:crypto";

const Body = z.object({ session_token: z.string(), agent_fid: z.number().int(), strategy: Strategy });

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const b = Body.parse(await req.json());
  const sess = await getSession(b.session_token);
  if (!sess || Number(sess.agent_fid) !== b.agent_fid) return new Response("unauthorized", { status: 401 });
  const strategy_hash = createHash("sha256").update(JSON.stringify(b.strategy)).digest("hex");
  const { error } = await db.from("agents").update({ strategy: b.strategy, strategy_hash }).eq("agent_fid", b.agent_fid);
  if (error) return new Response(JSON.stringify(error), { status: 500 });
  return Response.json({ strategy_hash });
}