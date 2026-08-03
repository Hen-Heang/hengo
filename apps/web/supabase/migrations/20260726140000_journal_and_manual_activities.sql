-- Second Brain, Phase 3: Journal + unified Timeline.
--
-- Two new, independent tables — nothing existing is touched. Journal entries
-- are deliberately lightweight: only content/mood/energy are ever validated
-- as "at least one populated" at the app layer (lib/journal.ts); every
-- individual column here is nullable so a one-field check-in is as valid as
-- a full daily reflection. Manual activities are the "I did this in real
-- life" counterpart to kori_activity_log (which only ever records time spent
-- inside Hengo) — the two are never conflated by the Timeline aggregator
-- (lib/timeline.ts).

create table if not exists public.kori_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  title text check (title is null or char_length(title) <= 200),
  content text not null default '' check (char_length(content) <= 4000),
  mood smallint check (mood is null or mood between 1 and 5),
  energy smallint check (energy is null or energy between 1 and 5),
  achievement text check (achievement is null or char_length(achievement) <= 4000),
  blocker text check (blocker is null or char_length(blocker) <= 4000),
  lesson text check (lesson is null or char_length(lesson) <= 4000),
  gratitude text check (gratitude is null or char_length(gratitude) <= 4000),
  tags text[] not null default '{}',
  goal_id uuid references public.goals(id) on delete set null,
  habit_id uuid references public.kori_habits(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(achievement, '') || ' ' || coalesce(blocker, '') || ' ' ||
      coalesce(lesson, '') || ' ' || coalesce(gratitude, '')), 'C')
  ) stored
);

create index if not exists kori_journal_entries_user_occurred_idx
  on public.kori_journal_entries (user_id, occurred_at desc);
create index if not exists kori_journal_entries_user_goal_idx
  on public.kori_journal_entries (user_id, goal_id) where goal_id is not null;
create index if not exists kori_journal_entries_user_habit_idx
  on public.kori_journal_entries (user_id, habit_id) where habit_id is not null;
create index if not exists kori_journal_entries_search_idx
  on public.kori_journal_entries using gin (search);
create index if not exists kori_journal_entries_tags_idx
  on public.kori_journal_entries using gin (tags);

alter table public.kori_journal_entries enable row level security;
revoke all on table public.kori_journal_entries from anon;
grant select, insert, update, delete on table public.kori_journal_entries to authenticated;

drop policy if exists "own journal entries" on public.kori_journal_entries;
create policy "own journal entries" on public.kori_journal_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.kori_manual_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  label text not null check (char_length(label) between 1 and 160),
  category text check (category is null or char_length(category) <= 60),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 0 and 1440),
  notes text check (notes is null or char_length(notes) <= 2000),
  goal_id uuid references public.goals(id) on delete set null,
  habit_id uuid references public.kori_habits(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kori_manual_activities_user_occurred_idx
  on public.kori_manual_activities (user_id, occurred_at desc);
create index if not exists kori_manual_activities_user_goal_idx
  on public.kori_manual_activities (user_id, goal_id) where goal_id is not null;
create index if not exists kori_manual_activities_user_habit_idx
  on public.kori_manual_activities (user_id, habit_id) where habit_id is not null;

alter table public.kori_manual_activities enable row level security;
revoke all on table public.kori_manual_activities from anon;
grant select, insert, update, delete on table public.kori_manual_activities to authenticated;

drop policy if exists "own manual activities" on public.kori_manual_activities;
create policy "own manual activities" on public.kori_manual_activities
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
