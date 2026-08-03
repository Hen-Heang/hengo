-- Per-request AI usage log, used for both cost visibility and the
-- application-level rate limits in lib/server/ai-limits.ts. Never stores
-- prompt/response text or headers — feature name + token/cost metadata only.

create table if not exists public.kori_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost numeric,
  latency_ms integer,
  success boolean not null,
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists kori_ai_usage_user_feature_created_idx
  on public.kori_ai_usage (user_id, feature, created_at desc);

alter table public.kori_ai_usage enable row level security;

revoke all on table public.kori_ai_usage from anon;
grant select, insert on table public.kori_ai_usage to authenticated;

drop policy if exists "own ai usage" on public.kori_ai_usage;
create policy "own ai usage" on public.kori_ai_usage
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
