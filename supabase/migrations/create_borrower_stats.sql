-- Borrower aggregate (single row per FID)
create table if not exists borrower_stats (
  fid bigint primary key,
  loans_total int not null default 0,
  loans_repaid int not null default 0,
  loans_on_time int not null default 0,
  loans_late int not null default 0,
  loans_defaulted int not null default 0,
  principal_borrowed_usdc_6 bigint not null default 0,
  principal_repaid_usdc_6 bigint not null default 0,
  outstanding_usdc_6 bigint not null default 0,
  on_time_rate numeric not null default 0,         -- 0..1
  longest_on_time_streak int not null default 0,   -- consecutive on-time
  last_repaid_at timestamptz,
  account_age_days int not null default 0,
  followers int not null default 0,
  ens_verified boolean not null default false,
  basename_verified boolean not null default false,
  score int not null default 0,                    -- 0..900
  tier text not null default 'C',                  -- A|B|C|D
  badges jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_borrower_stats_score on borrower_stats(score desc);

-- Ensure we have these indexes on existing tables
create index if not exists idx_loans_borrower on loans(borrower_fid);
create index if not exists idx_loans_status on loans(status);

-- Recompute function (run on writes)
create or replace function recompute_borrower_stats(p_fid bigint)
returns void language plpgsql as $$
declare
  v_followers int := 0;        -- TODO: hydrate from your Farcaster cache
  v_age_days int := 0;         -- TODO: days since account_created_at in your user table
  v_ens bool := false; v_base bool := false;
  v_loans_total int; v_loans_repaid int; v_loans_defaulted int; v_loans_late int; v_loans_on_time int;
  v_principal_borrowed bigint; v_principal_repaid bigint; v_outstanding bigint; v_last_repaid timestamptz;
  v_on_time_rate numeric; v_streak int; v_score int; v_tier text; v_badges jsonb := '[]'::jsonb;
begin
  -- Count loan statuses
  select
    count(*) filter (where true),
    count(*) filter (where status = 'repaid'),
    count(*) filter (where status = 'default'),
    count(*) filter (where status = 'overdue'),
    count(*) filter (where status = 'repaid' and updated_at <= due_ts)
  into v_loans_total, v_loans_repaid, v_loans_defaulted, v_loans_late, v_loans_on_time
  from loans l
  where l.borrower_fid = p_fid;

  -- Calculate financial totals (using existing gross_usdc field)
  select 
    coalesce(sum(gross_usdc),0),
    coalesce(sum(case when status = 'repaid' then gross_usdc else 0 end),0),
    coalesce(sum(case when status in ('funded','active') then gross_usdc else 0 end),0)
  into v_principal_borrowed, v_principal_repaid, v_outstanding
  from loans where borrower_fid = p_fid;

  -- Convert to usdc_6 (multiply by 1M for 6 decimals)
  v_principal_borrowed := v_principal_borrowed * 1000000;
  v_principal_repaid := v_principal_repaid * 1000000;
  v_outstanding := v_outstanding * 1000000;

  -- Get last repayment timestamp
  select max(updated_at) into v_last_repaid
  from loans where borrower_fid = p_fid and status = 'repaid';

  -- Calculate on-time rate
  v_on_time_rate := case when v_loans_repaid = 0 then 0 else v_loans_on_time::numeric / v_loans_repaid end;

  -- Calculate streak (consecutive on-time loans from most recent)
  with ordered as (
    select status, 
           (status = 'repaid' and updated_at <= due_ts) as on_time,
           row_number() over (order by created_at desc) as rn
    from loans where borrower_fid = p_fid and status in ('repaid','default','overdue')
  )
  select coalesce(
    (select count(*) from ordered o1 
     where o1.rn <= (select min(o2.rn) from ordered o2 where not o2.on_time)
     and o1.on_time),
    (select count(*) from ordered where on_time)
  ) into v_streak;

  -- Hardcoded signals for now (TODO: integrate with real Farcaster data)
  -- You can update this based on your existing user data
  v_followers := 100; -- default
  v_age_days := 365; -- default
  v_ens := false;
  v_base := false;

  -- Score 0..900 (opinionated, deterministic)
  v_score :=
    greatest(0, least(900,
      200                                  -- base
      + least(400, 60 * v_loans_repaid)    -- +60 per repaid (cap +400)
      + floor(200 * v_on_time_rate)        -- up to +200
      - 100 * v_loans_late                 -- -100 per late loan
      - 250 * v_loans_defaulted            -- -250 per default
      + least(60, v_age_days / 30)         -- +1 per month (cap +60)
      + least(60, v_followers / 200)       -- +1 per 200 followers (cap +60)
      + case when v_ens then 30 else 0 end
      + case when v_base then 30 else 0 end
    ));

  -- Determine tier
  v_tier := case
    when v_score >= 750 then 'A'
    when v_score >= 650 then 'B'
    when v_score >= 550 then 'C'
    else 'D'
  end;

  -- Calculate badges
  if v_loans_repaid >= 1 then v_badges := v_badges || jsonb_build_object('first_repayment', true); end if;
  if v_streak >= 3 then v_badges := v_badges || jsonb_build_object('streak_3', true); end if;
  if v_streak >= 10 then v_badges := v_badges || jsonb_build_object('streak_10', true); end if;
  if v_loans_defaulted = 0 and v_loans_repaid >= 5 then v_badges := v_badges || jsonb_build_object('clean_5', true); end if;

  -- Upsert borrower stats
  insert into borrower_stats(fid, loans_total, loans_repaid, loans_on_time, loans_late, loans_defaulted,
                             principal_borrowed_usdc_6, principal_repaid_usdc_6, outstanding_usdc_6, on_time_rate,
                             longest_on_time_streak, last_repaid_at, account_age_days, followers, ens_verified, basename_verified,
                             score, tier, badges, updated_at)
  values (p_fid, v_loans_total, v_loans_repaid, v_loans_on_time, v_loans_late, v_loans_defaulted,
          v_principal_borrowed, v_principal_repaid, v_outstanding, v_on_time_rate,
          v_streak, v_last_repaid, v_age_days, v_followers, v_ens, v_base,
          v_score, v_tier, v_badges, now())
  on conflict (fid) do update set
    loans_total=excluded.loans_total,
    loans_repaid=excluded.loans_repaid,
    loans_on_time=excluded.loans_on_time,
    loans_late=excluded.loans_late,
    loans_defaulted=excluded.loans_defaulted,
    principal_borrowed_usdc_6=excluded.principal_borrowed_usdc_6,
    principal_repaid_usdc_6=excluded.principal_repaid_usdc_6,
    outstanding_usdc_6=excluded.outstanding_usdc_6,
    on_time_rate=excluded.on_time_rate,
    longest_on_time_streak=excluded.longest_on_time_streak,
    last_repaid_at=excluded.last_repaid_at,
    account_age_days=excluded.account_age_days,
    followers=excluded.followers,
    ens_verified=excluded.ens_verified,
    basename_verified=excluded.basename_verified,
    score=excluded.score,
    tier=excluded.tier,
    badges=excluded.badges,
    updated_at=now();
end$$;

-- Triggers: recompute on any loan status change
create or replace function trg_recompute_stats_on_loan()
returns trigger language plpgsql as $$
begin
  perform recompute_borrower_stats(coalesce(new.borrower_fid, old.borrower_fid));
  return new;
end$$;

drop trigger if exists t_loans_stats on loans;
create trigger t_loans_stats after insert or update of status, gross_usdc on loans
for each row execute function trg_recompute_stats_on_loan();