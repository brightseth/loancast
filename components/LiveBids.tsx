"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Bid = {
  id: string;
  amount: number;          // in USDC
  bidderFid?: number;
  bidderHandle?: string;
  txHash?: string;         // optional (if you ever mirror on-chain)
  createdAt: string;       // ISO timestamp
};

type Props = {
  loanId: string;
  endsAt: string;          // ISO (settlement time, 24h after creation)
  initialBids?: Bid[];     // optional SSR hydration (from GET /api/loans/:id/bids)
};

export default function LiveBids({ loanId, endsAt, initialBids = [] }: Props) {
  const [bids, setBids] = useState<Bid[]>(
    [...initialBids].sort((a, b) => b.amount - a.amount || +new Date(b.createdAt) - +new Date(a.createdAt))
  );
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // derived
  const leader = bids[0] ?? null;
  const bidCount = bids.length;

  // countdown
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const msLeft = useMemo(() => Math.max(0, +new Date(endsAt) - now), [endsAt, now]);
  const hh = String(Math.floor(msLeft / 3_600_000)).padStart(2, "0");
  const mm = String(Math.floor((msLeft % 3_600_000) / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((msLeft % 60_000) / 1000)).padStart(2, "0");

  // SSE subscribe
  useEffect(() => {
    // Close prior stream if any (route changes)
    if (esRef.current) esRef.current.close();
    setConnected(false);
    setError(null);

    const url = `/api/loans/${encodeURIComponent(loanId)}/bids/stream`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (evt) => {
      try {
        // Expect server to send JSON lines: { type: "snapshot" | "append", bids?: Bid[], bid?: Bid }
        const payload = JSON.parse(evt.data);
        if (payload.type === "snapshot" && Array.isArray(payload.bids)) {
          setBids(
            payload.bids
              .map(normalizeBid)
              .sort((a: Bid, b: Bid) => b.amount - a.amount || +new Date(b.createdAt) - +new Date(a.createdAt))
          );
        } else if (payload.type === "append" && payload.bid) {
          setBids((prev) => {
            const next = upsert(prev, normalizeBid(payload.bid));
            return next.sort((a, b) => b.amount - a.amount || +new Date(b.createdAt) - +new Date(a.createdAt));
          });
        }
      } catch (e) {
        // Ignore malformed messages to keep UI resilient
        console.warn("SSE parse error", e);
      }
    };

    es.onerror = (_evt) => {
      // EventSource auto-reconnects; mark UI "degraded" but don't thrash
      setConnected(false);
      setError("Reconnecting…");
    };

    return () => {
      es.close();
    };
  }, [loanId]);

  return (
    <div className="rounded-2xl border p-4 md:p-5">
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="font-semibold">Live Bids</div>
        <div className="text-sm tabular-nums">
          ⏳ {hh}:{mm}:{ss}
        </div>
      </header>

      <div className="flex items-center gap-2 text-sm mb-4">
        <span className={`inline-flex h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-amber-500"}`} />
        <span className="text-gray-500">
          {connected ? "Streaming" : error ?? "Connecting…"}
        </span>
        <span className="ml-auto text-gray-500">{bidCount} bid{bidCount === 1 ? "" : "s"}</span>
      </div>

      {leader ? (
        <div className="mb-4 rounded-xl border p-3 bg-gray-50">
          <div className="text-xs text-gray-500 mb-1">Current High Bid</div>
          <div className="text-xl font-semibold leading-tight">
            {leader.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </div>
          <div className="text-sm text-gray-500">
            {renderBidder(leader)} • {new Date(leader.createdAt).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="mb-4 text-sm text-gray-500">No bids yet — be the first.</div>
      )}

      <ol className="space-y-2 max-h-72 overflow-auto pr-1">
        {bids.map((b) => (
          <li key={b.id} className="rounded-lg border p-2.5">
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
              </div>
              <div className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-sm text-gray-500">{renderBidder(b)}</div>
            {b.txHash ? (
              <a
                className="text-xs underline text-gray-500"
                href={`https://basescan.org/tx/${b.txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                tx ↗
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

// Helpers
function upsert(list: Bid[], item: Bid): Bid[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [item, ...list];
  const next = list.slice();
  next[i] = item;
  return next;
}

function normalizeBid(b: any): Bid {
  return {
    id: String(b.id ?? cryptoRandom()),
    amount: typeof b.amount === "number" ? b.amount : Number(b.amount),
    bidderFid: b.bidderFid ?? b.fid ?? undefined,
    bidderHandle: b.bidderHandle ?? b.handle ?? undefined,
    txHash: b.txHash ?? undefined,
    createdAt: b.createdAt ?? new Date().toISOString(),
  };
}

function renderBidder(b: Bid) {
  if (b.bidderHandle) return `@${b.bidderHandle}`;
  if (b.bidderFid) return `FID ${b.bidderFid}`;
  return "Anonymous";
}

function cryptoRandom() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as any).randomUUID();
  return Math.random().toString(36).slice(2);
}