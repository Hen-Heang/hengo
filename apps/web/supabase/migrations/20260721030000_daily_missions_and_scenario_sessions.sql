-- Persistent daily mission (one row per user per Korea-calendar day, built by
-- lib/learning/mission-engine.ts and stored so it survives a page refresh)
-- plus scenario-practice sessions, which give scenario mission items real
-- completion evidence instead of "the button was clicked."

create table if not exists public.kori_daily_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_date date not null,
  title text not null,
  reason text not null,
  estimated_minutes integer not null default 0,
  focus_skill_codes text[] not null default '{}',
  context_snapshot jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mission_date)
);

create table if not exists public.kori_daily_mission_items (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.kori_daily_missions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('vocab_review', 'correction_review', 'daily_phrase', 'scenario', 'listening', 'interview')),
  title text not null,
  reason text not null,
  target_count integer not null default 1,
  reference_ids text[] not null default '{}',
  skill_codes text[] not null default '{}',
  estimated_minutes integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  progress_count integer not null default 0,
  completed_at timestamptz,
  evidence jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.kori_scenario_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id text not null,
  conversation_id uuid references public.kori_conversations(id) on delete cascade,
  mission_item_id uuid references public.kori_daily_mission_items(id) on delete set null,
  user_turn_count integer not null default 0,
  task_completed boolean not null default false,
  score integer check (score between 0 and 100),
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists kori_daily_missions_user_date_idx
  on public.kori_daily_missions (user_id, mission_date desc);
create index if not exists kori_daily_mission_items_mission_idx
  on public.kori_daily_mission_items (mission_id);
create index if not exists kori_daily_mission_items_user_status_idx
  on public.kori_daily_mission_items (user_id, status);
create index if not exists kori_scenario_sessions_user_conversation_idx
  on public.kori_scenario_sessions (user_id, conversation_id);
create index if not exists kori_scenario_sessions_conversation_idx
  on public.kori_scenario_sessions (conversation_id);

alter table public.kori_daily_missions enable row level security;
alter table public.kori_daily_mission_items enable row level security;
alter table public.kori_scenario_sessions enable row level security;

revoke all on table public.kori_daily_missions from anon;
revoke all on table public.kori_daily_mission_items from anon;
revoke all on table public.kori_scenario_sessions from anon;
grant select, insert, update, delete on table public.kori_daily_missions to authenticated;
grant select, insert, update, delete on table public.kori_daily_mission_items to authenticated;
grant select, insert, update, delete on table public.kori_scenario_sessions to authenticated;

drop policy if exists "own daily missions" on public.kori_daily_missions;
create policy "own daily missions" on public.kori_daily_missions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own daily mission items" on public.kori_daily_mission_items;
create policy "own daily mission items" on public.kori_daily_mission_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own scenario sessions" on public.kori_scenario_sessions;
create policy "own scenario sessions" on public.kori_scenario_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
