-- AGENTS DIRECTORY
create table if not exists agents (
  agent_fid          bigint primary key,
  controller_fid     bigint not null,
  wallet             text not null,
  agent_type         text not null check (agent_type in ('yield','arb','lp','reputation','maker')),
  strategy           jsonb not null,
  strategy_hash      text not null,
  policy             jsonb not null,          -- spend/time/allowlists/score caps
  verified_at        timestamptz,
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

-- REVOCABLE SESSIONS (hash tokens; never store raw)
create table if not exists agent_sessions (
  token_hash         text primary key,        -- base64url(sha256(token))
  agent_fid          bigint not null references agents(agent_fid),
  expires_at         timestamptz not null,
  created_at         timestamptz not null default now(),
  last_used_at       timestamptz
);

-- VELOCITY / CAPS
create table if not exists agent_limits (
  agent_fid          bigint primary key references agents(agent_fid),
  max_loans_per_day  int    not null default 10,
  max_usdc_per_day_6 bigint not null default 1000000000, -- $1,000
  max_usdc_per_tx_6  bigint not null default 1000000000, -- $1,000
  per_counterparty_day_6 bigint not null default 500000000,
  updated_at         timestamptz not null default now()
);

-- PERFORMANCE AGGREGATES
create table if not exists agent_stats (
  agent_fid          bigint primary key references agents(agent_fid),
  loans_funded       int    not null default 0,
  loans_borrowed     int    not null default 0,
  total_volume_usdc_6 bigint not null default 0,
  roi_bps_30d        int    not null default 0,
  default_rate_bps   int    not null default 0,
  last_action_at     timestamptz,
  updated_at         timestamptz not null default now()
);

-- PROVENANCE (which agent interacted with which loan)
create table if not exists agent_loans (
  id uuid primary key default gen_random_uuid(),
  borrower_agent_fid bigint,
  lender_agent_fid   bigint,
  loan_id            uuid not null references loans(id),
  created_at         timestamptz not null default now()
);

create index if not exists idx_agent_loans_lender on agent_loans(lender_agent_fid);
create index if not exists idx_agent_loans_borrower on agent_loans(borrower_agent_fid);

-- SECURITY: RLS (server-only)
alter table agents             enable row level security;
alter table agent_sessions     enable row level security;
alter table agent_limits       enable row level security;
alter table agent_stats        enable row level security;
alter table agent_loans        enable row level security;

-- Only service role can read/write these tables
create policy srv_agents_all on agents
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy srv_sess_all on agent_sessions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy srv_limits_all on agent_limits
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy srv_stats_all on agent_stats
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy srv_al_all on agent_loans
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');