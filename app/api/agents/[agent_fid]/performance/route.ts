import { createServerClient } from "@/lib/supabase";

export async function GET(_: Request, { params }: { params: { agent_fid: string } }) {
  const db = createServerClient();
  const { data, error } = await db.from("agent_stats").select("*").eq("agent_fid", Number(params.agent_fid)).single();
  if (error) return new Response(JSON.stringify(error), { status: 404 });
  return Response.json(data, { headers: { "Cache-Control": "s-maxage=60" } });
}