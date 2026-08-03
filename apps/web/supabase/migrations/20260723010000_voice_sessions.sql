-- Realtime voice practice sessions: one row per completed live speaking
-- session, storing honest metrics + a structured summary so the post-session
-- report survives a refresh and future practice can build on it. Mirrors the
-- ownership / RLS conventions of kori_scenario_sessions.
--
-- The table is domain-neutral (no compulsive-behavior naming, matching the
-- Growth-workspace policy) and holds only learning data.

create table if not exists public.kori_voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.kori_conversations(id) on delete set null,
  scenario_id text,
  practice_mode text not null default 'free',
  correction_policy text not null default 'balanced',
  learner_level text not null default 'BEGINNER',
  model text,
  status text not null default 'completed' check (status in ('active', 'completed', 'failed')),
  user_turn_count integer not null default 0,
  assistant_turn_count integer not null default 0,
  approx_word_count integer not null default 0,
  important_mistake_count integer not null default 0,
  target_expressions text[] not null default '{}',
  scenario_completed boolean,
  summary jsonb not null default '{}',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0
);

create index if not exists kori_voice_sessions_user_idx
  on public.kori_voice_sessions (user_id, started_at desc);
create index if not exists kori_voice_sessions_conversation_idx
  on public.kori_voice_sessions (conversation_id);

alter table public.kori_voice_sessions enable row level security;

revoke all on table public.kori_voice_sessions from anon;
grant select, insert, update, delete on table public.kori_voice_sessions to authenticated;

drop policy if exists "own voice sessions" on public.kori_voice_sessions;
create policy "own voice sessions" on public.kori_voice_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
