-- LOANS: Label the counterparty types
alter table loans
  add column if not exists borrower_type text not null default 'human' check (borrower_type in ('human','agent')),
  add column if not exists lender_type   text check (lender_type in ('human','agent'));

-- HUMAN AUTOLEND PREFERENCES (opt-in)
create table if not exists human_autolend_prefs (
  fid bigint primary key,
  active boolean not null default false,
  min_credit_score int not null default 650,
  max_loan_amount_usdc_6 bigint not null default 400000000,  -- $400
  preferred_duration int[] not null default '{7,14,30}',
  allow_counterparty text not null default 'human' check (allow_counterparty in ('human','agent','both')),
  daily_usdc_cap_6 bigint not null default 700000000,        -- $700/day
  per_tx_cap_6 bigint not null default 400000000,            -- $400/tx
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- HUMAN LENDER PERFORMANCE (visible on profiles)
create table if not exists human_lender_stats (
  fid bigint primary key,
  loans_funded int not null default 0,
  volume_usdc_6 bigint not null default 0,
  roi_bps_30d int not null default 0,
  default_rate_bps int not null default 0,
  updated_at timestamptz not null default now()
);

-- TAG PROVENANCE WITH TYPES
alter table agent_loans
  add column if not exists borrower_type text,
  add column if not exists lender_type text;

-- SECURITY: RLS for new tables
alter table human_autolend_prefs enable row level security;
alter table human_lender_stats enable row level security;

create policy srv_human_autolend_all on human_autolend_prefs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy srv_human_lender_all on human_lender_stats
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- UPDATE EXISTING LOANS to mark as human borrowers
update loans set borrower_type = 'human' where borrower_type is null;

-- INDEX for performance
create index if not exists idx_loans_borrower_type on loans(borrower_type);
create index if not exists idx_loans_lender_type on loans(lender_type);