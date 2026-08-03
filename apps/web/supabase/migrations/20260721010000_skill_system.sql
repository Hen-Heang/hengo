-- Normalized skill mastery system shared across Chat, Corrections, Vocabulary,
-- Listening, Scenarios, Foundations, and Interview Prep. skill_code values are
-- a closed set defined in lib/learning/skills.ts (SKILL_CODES) — this table
-- does not enforce that with a check constraint so the taxonomy can evolve
-- without a migration, but application code must always go through it.

create table if not exists public.kori_skill_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_code text not null,
  source_feature text not null,
  source_id text,
  score integer not null check (score between 0 and 100),
  confidence numeric,
  difficulty text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.kori_skill_mastery (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_code text not null,
  mastery_score numeric not null default 0,
  recent_score numeric,
  attempt_count integer not null default 0,
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_code)
);

create index if not exists kori_skill_events_user_skill_idx
  on public.kori_skill_events (user_id, skill_code, created_at desc);
create index if not exists kori_skill_events_user_feature_idx
  on public.kori_skill_events (user_id, source_feature, created_at desc);
create index if not exists kori_skill_mastery_user_score_idx
  on public.kori_skill_mastery (user_id, mastery_score);

alter table public.kori_skill_events enable row level security;
alter table public.kori_skill_mastery enable row level security;

revoke all on table public.kori_skill_events from anon;
revoke all on table public.kori_skill_mastery from anon;
grant select, insert on table public.kori_skill_events to authenticated;
grant select, insert, update on table public.kori_skill_mastery to authenticated;

drop policy if exists "own skill events" on public.kori_skill_events;
create policy "own skill events" on public.kori_skill_events
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own skill mastery" on public.kori_skill_mastery;
create policy "own skill mastery" on public.kori_skill_mastery
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Atomic "record one skill event + upsert the aggregate mastery row" RPC.
-- The new mastery/attempt-count values are computed client-side by the pure,
-- tested lib/learning/mastery.ts algorithm and passed in — this function's
-- job is just atomicity + ownership enforcement, not the mastery math.
-- security invoker (the default) so RLS applies exactly as it would to two
-- separate client calls; no service-role/definer escalation needed.
create or replace function public.kori_record_skill_event(
  p_skill_code text,
  p_source_feature text,
  p_new_mastery numeric,
  p_new_attempt_count integer,
  p_score integer,
  p_source_id text default null,
  p_confidence numeric default null,
  p_difficulty text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.kori_skill_mastery
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.kori_skill_mastery;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_score < 0 or p_score > 100 then
    raise exception 'score must be between 0 and 100';
  end if;
  if p_new_mastery < 0 or p_new_mastery > 100 then
    raise exception 'mastery must be between 0 and 100';
  end if;

  insert into public.kori_skill_events (
    user_id, skill_code, source_feature, source_id, score, confidence, difficulty, metadata
  ) values (
    v_user_id, p_skill_code, p_source_feature, p_source_id, p_score, p_confidence, p_difficulty, coalesce(p_metadata, '{}'::jsonb)
  );

  insert into public.kori_skill_mastery (
    user_id, skill_code, mastery_score, recent_score, attempt_count, last_practiced_at, updated_at
  ) values (
    v_user_id, p_skill_code, p_new_mastery, p_score, p_new_attempt_count, now(), now()
  )
  on conflict (user_id, skill_code) do update
    set mastery_score = excluded.mastery_score,
        recent_score = excluded.recent_score,
        attempt_count = excluded.attempt_count,
        last_practiced_at = excluded.last_practiced_at,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.kori_record_skill_event from public;
grant execute on function public.kori_record_skill_event to authenticated;
