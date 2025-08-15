import "dotenv/config";
import fetch from "node-fetch";
import { setTimeout as sleep } from "node:timers/promises";

type Strategy = {
  riskTolerance: 'conservative'|'moderate'|'aggressive';
  maxLoanAmount: number; minCreditScore: number; preferredDuration: number[];
  blacklistedAgents: string[]; whitelistedAgents: string[];
};

const BASE = process.env.LOANCAST_BASE ?? "https://loancast.app";

async function main() {
  const agent_fid = Number(process.env.AGENT_FID);
  const controller_fid = Number(process.env.CONTROLLER_FID);
  const wallet = process.env.AGENT_WALLET_ADDRESS!;
  const manifest_signature = process.env.AGENT_MANIFEST_SIG!; // sign JSON string offline using the wallet

  const strategy: Strategy = {
    riskTolerance: 'moderate', maxLoanAmount: 700, minCreditScore: 650,
    preferredDuration: [7,14,30], blacklistedAgents: [], whitelistedAgents: []
  };

  // auth
  let r = await fetch(`${BASE}/api/agents/auth`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_fid, controller_fid, wallet, agent_type: "lp", strategy,
      policy: { daily_usdc_cap: 1000, per_tx_cap: 700, per_counterparty_cap: 500, allow_autofund: true },
      manifest_signature })
  });
  const auth = await r.json();
  const token = auth.session_token;

  for (;;) {
    const q = new URLSearchParams({ minScore: "650", maxAmount: "700000000" }); // 700 USDC * 1e6
    const res = await fetch(`${BASE}/api/loans/available?${q.toString()}`);
    const ops = await res.json();
    for (const op of ops) {
      const resp = await fetch(`${BASE}/api/loans/${op.id}/auto-fund`, {
        method: "POST", headers: { "content-type":"application/json" },
        body: JSON.stringify({ session_token: token, agent_fid })
      });
      const out = await resp.json();
      if (out.ok) console.log("Funded intent:", op.id, out);
      await sleep(500); // be polite
    }
    await sleep(10_000);
  }
}
main().catch(console.error);