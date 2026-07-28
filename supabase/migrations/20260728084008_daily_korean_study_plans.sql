-- One durable Korean study plan per user and Asia/Seoul study date.

create table if not exists public.kori_daily_study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  mode text not null default 'normal' check (mode in ('busy', 'normal', 'office')),
  topic_key text not null,
  topic_label text not null,
  romanization_visible boolean not null default true,
  activities jsonb not null default '[]'::jsonb check (jsonb_typeof(activities) = 'array'),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  attempts jsonb not null default '[]'::jsonb check (jsonb_typeof(attempts) = 'array'),
  reflection text not null default '',
  mission_result text not null default '',
  total_focus_seconds integer not null default 0 check (total_focus_seconds >= 0),
  speaking_seconds integer not null default 0 check (speaking_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, study_date)
);

create index if not exists kori_daily_study_plans_user_date_idx
  on public.kori_daily_study_plans (user_id, study_date desc);

alter table public.kori_daily_study_plans enable row level security;

revoke all on table public.kori_daily_study_plans from anon;
grant select, insert, update on table public.kori_daily_study_plans to authenticated;

drop policy if exists "own daily study plans select" on public.kori_daily_study_plans;
create policy "own daily study plans select" on public.kori_daily_study_plans
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own daily study plans insert" on public.kori_daily_study_plans;
create policy "own daily study plans insert" on public.kori_daily_study_plans
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "own daily study plans update" on public.kori_daily_study_plans;
create policy "own daily study plans update" on public.kori_daily_study_plans
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
