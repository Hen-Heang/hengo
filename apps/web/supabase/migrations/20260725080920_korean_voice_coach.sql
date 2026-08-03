-- AI Korean Voice Coach (chained speech -> text -> feedback -> speech MVP).
--
-- Reuses:
--   * kori_voice_sessions for both chained and future realtime session summaries
--   * kori_corrections for deduplicated mistake/SRS cards
--   * kori_vocab_cards for learner-saved vocabulary
--
-- Raw audio is intentionally not stored. Speaking attempts contain only the
-- speech-recognition transcript and validated learning feedback.

-- Make the shared session table efficient for the coach dashboard and recent
-- session history. Coach rows use practice_mode values beginning with
-- "korean_coach_"; existing realtime rows are unchanged.
create index if not exists kori_voice_sessions_user_mode_started_idx
  on public.kori_voice_sessions (user_id, practice_mode, started_at desc);
create index if not exists kori_voice_sessions_user_status_started_idx
  on public.kori_voice_sessions (user_id, status, started_at desc);

-- One tutor question/message per turn. The tutor message is a validated
-- KoreanPhrase snapshot so session history remains meaningful if scenario
-- seed copy changes later.
create table if not exists public.kori_korean_practice_turns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.kori_voice_sessions(id) on delete cascade,
  turn_number integer not null check (turn_number between 1 and 20),
  tutor_message jsonb not null default '{}'
    check (jsonb_typeof(tutor_message) = 'object'),
  transcript_revealed boolean not null default false,
  hint_used boolean not null default false,
  task_completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, turn_number)
);

create index if not exists kori_korean_turns_user_created_idx
  on public.kori_korean_practice_turns (user_id, created_at desc);
create index if not exists kori_korean_turns_session_turn_idx
  on public.kori_korean_practice_turns (session_id, turn_number);

alter table public.kori_korean_practice_turns enable row level security;
revoke all on table public.kori_korean_practice_turns from anon;
grant select, insert, update, delete on table public.kori_korean_practice_turns to authenticated;

drop policy if exists "own Korean practice turns" on public.kori_korean_practice_turns;
create policy "own Korean practice turns" on public.kori_korean_practice_turns
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.kori_voice_sessions session
      where session.id = kori_korean_practice_turns.session_id
        and session.user_id = (select auth.uid())
    )
  );

-- Retains every retry within a turn, but never the raw recording. `feedback`
-- is the server-validated KoreanTutorFeedback object. Text fallback attempts
-- use input_method = 'text'.
create table if not exists public.kori_korean_speaking_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.kori_voice_sessions(id) on delete cascade,
  turn_id uuid not null references public.kori_korean_practice_turns(id) on delete cascade,
  input_method text not null check (input_method in ('audio', 'text')),
  transcript text not null check (char_length(transcript) between 1 and 2000),
  feedback jsonb not null default '{}'
    check (jsonb_typeof(feedback) = 'object'),
  recording_duration_ms integer check (
    recording_duration_ms is null or recording_duration_ms between 0 and 300000
  ),
  is_retry boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists kori_korean_attempts_user_created_idx
  on public.kori_korean_speaking_attempts (user_id, created_at desc);
create index if not exists kori_korean_attempts_session_created_idx
  on public.kori_korean_speaking_attempts (session_id, created_at);
create index if not exists kori_korean_attempts_turn_created_idx
  on public.kori_korean_speaking_attempts (turn_id, created_at);

alter table public.kori_korean_speaking_attempts enable row level security;
revoke all on table public.kori_korean_speaking_attempts from anon;
grant select, insert, update, delete on table public.kori_korean_speaking_attempts to authenticated;

drop policy if exists "own Korean speaking attempts" on public.kori_korean_speaking_attempts;
create policy "own Korean speaking attempts" on public.kori_korean_speaking_attempts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.kori_voice_sessions session
      where session.id = kori_korean_speaking_attempts.session_id
        and session.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.kori_korean_practice_turns turn_row
      where turn_row.id = kori_korean_speaking_attempts.turn_id
        and turn_row.session_id = kori_korean_speaking_attempts.session_id
        and turn_row.user_id = (select auth.uid())
    )
  );

-- One compact preference row per learner. These defaults match the requested
-- beginner-first, slow-audio, short-session experience.
create table if not exists public.kori_korean_coach_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level text not null default 'beginner'
    check (level in ('beginner', 'lower-intermediate', 'intermediate')),
  main_goal text not null default 'workplace'
    check (main_goal in ('workplace', 'daily-life', 'presentation', 'general')),
  explanation_language text not null default 'English'
    check (explanation_language = 'English'),
  romanization_mode text not null default 'on-request'
    check (romanization_mode in ('always', 'on-request', 'never')),
  default_speech_speed numeric not null default 0.75
    check (default_speech_speed in (0.75, 1, 1.25)),
  daily_practice_goal_minutes integer not null default 10
    check (daily_practice_goal_minutes between 5 and 120),
  preferred_practice_duration_minutes integer not null default 10
    check (preferred_practice_duration_minutes between 5 and 60),
  correction_strictness text not null default 'balanced'
    check (correction_strictness in ('gentle', 'balanced', 'detailed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kori_korean_coach_preferences enable row level security;
revoke all on table public.kori_korean_coach_preferences from anon;
grant select, insert, update, delete on table public.kori_korean_coach_preferences to authenticated;

drop policy if exists "own Korean coach preferences" on public.kori_korean_coach_preferences;
create policy "own Korean coach preferences" on public.kori_korean_coach_preferences
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Coach metadata extends the shared corrections notebook. The existing
-- fingerprint unique index and occurrence_count implement deduplication.
alter table public.kori_corrections
  add column if not exists scenario_id text,
  add column if not exists scenario_category text
    check (scenario_category is null or scenario_category in ('workplace', 'daily')),
  add column if not exists english_meaning text,
  add column if not exists coach_review_count integer not null default 0,
  add column if not exists coach_mastered boolean not null default false;

create index if not exists kori_corrections_user_coach_status_idx
  on public.kori_corrections (
    user_id,
    source_feature,
    coach_mastered,
    created_at desc
  );
create index if not exists kori_corrections_user_scenario_idx
  on public.kori_corrections (user_id, scenario_id, created_at desc);
