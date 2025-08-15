import { randomBytes, createHash } from "node:crypto";
import { createServerClient } from "@/lib/supabase";

export function newSessionToken(): { token: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw + process.env.AGENT_SESSION_SECRET!).digest("base64url");
  return { token: raw, hash };
}

export async function storeSession(agent_fid: number, tokenHash: string, ttlHours = 24) {
  const db = createServerClient();
  const expires = new Date(Date.now() + ttlHours * 3600_000).toISOString();
  const { error } = await db.from("agent_sessions").insert({ token_hash: tokenHash, agent_fid, expires_at: expires });
  if (error) throw error;
  return expires;
}

export async function getSession(token: string) {
  const db = createServerClient();
  const hash = createHash("sha256").update(token + process.env.AGENT_SESSION_SECRET!).digest("base64url");
  const { data, error } = await db.from("agent_sessions").select("*").eq("token_hash", hash).single();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  await db.from("agent_sessions").update({ last_used_at: new Date().toISOString() }).eq("token_hash", hash);
  return data;
}