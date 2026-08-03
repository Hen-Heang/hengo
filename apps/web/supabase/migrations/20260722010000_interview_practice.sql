-- Interview Practice extension for the existing Exam Prep module
-- (lib/interview.ts, app/(main)/interview/*). Adds the pieces that module
-- didn't have yet: a real, per-user-extendable question bank (previously a
-- hardcoded TS array), durable per-answer practice history (previously
-- rendered once and discarded — see components/interview/SpeakingScoreCard),
-- per-question progress for weak-question prioritization, and named script
-- version snapshots layered on top of the existing single-draft
-- kori_interview_scripts row. kori_interview_scripts / kori_interview_attempts
-- / kori_vocab_cards / kori_corrections are untouched and reused as-is.

-- ── Question bank ─────────────────────────────────────────────────────────
-- created_by_user_id is null for shared/seed questions (readable by every
-- authenticated user, writable only by trusted server-side seeding — no
-- client-side policy ever allows created_by_user_id = null on insert/update),
-- or a user's own id for a question they added themselves.
create table if not exists public.kori_interview_questions (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid references auth.users(id) on delete cascade,
  topic_id text not null default 'weather',
  slug text unique,
  question_ko text not null check (char_length(question_ko) between 1 and 500),
  question_en text,
  sample_answer_ko text,
  sample_answer_en text,
  category text not null default 'topic_selection'
    check (category in (
      'topic_selection', 'korean_summer', 'cambodian_weather', 'comparison',
      'daily_life', 'health', 'personal_experience', 'swimming_pool',
      'seonyudo_park', 'adaptation', 'opinion', 'unexpected_followup'
    )),
  difficulty text not null default 'normal' check (difficulty in ('beginner', 'normal', 'challenging')),
  priority text not null default 'recommended' check (priority in ('must_practice', 'recommended', 'optional')),
  keywords text[] not null default '{}',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kori_interview_questions_topic_active_idx
  on public.kori_interview_questions (topic_id, active, display_order);
create index if not exists kori_interview_questions_owner_idx
  on public.kori_interview_questions (created_by_user_id);

alter table public.kori_interview_questions enable row level security;
revoke all on table public.kori_interview_questions from anon;
grant select, insert, update, delete on table public.kori_interview_questions to authenticated;

drop policy if exists "read shared or own interview questions" on public.kori_interview_questions;
create policy "read shared or own interview questions" on public.kori_interview_questions
  for select to authenticated
  using (created_by_user_id is null or (select auth.uid()) = created_by_user_id);

drop policy if exists "insert own interview questions" on public.kori_interview_questions;
create policy "insert own interview questions" on public.kori_interview_questions
  for insert to authenticated
  with check ((select auth.uid()) = created_by_user_id);

drop policy if exists "update own interview questions" on public.kori_interview_questions;
create policy "update own interview questions" on public.kori_interview_questions
  for update to authenticated
  using ((select auth.uid()) = created_by_user_id)
  with check ((select auth.uid()) = created_by_user_id);

drop policy if exists "delete own interview questions" on public.kori_interview_questions;
create policy "delete own interview questions" on public.kori_interview_questions
  for delete to authenticated
  using ((select auth.uid()) = created_by_user_id);

-- ── Per-user, per-question progress (feeds weak-question prioritization) ──
create table if not exists public.kori_interview_question_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.kori_interview_questions(id) on delete cascade,
  times_practiced integer not null default 0,
  avg_score numeric,
  last_score numeric,
  last_practiced_at timestamptz,
  status text not null default 'new' check (status in ('new', 'practicing', 'improving', 'strong')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists kori_interview_question_progress_user_status_idx
  on public.kori_interview_question_progress (user_id, status, last_practiced_at);

alter table public.kori_interview_question_progress enable row level security;
revoke all on table public.kori_interview_question_progress from anon;
grant select, insert, update, delete on table public.kori_interview_question_progress to authenticated;

drop policy if exists "own interview question progress" on public.kori_interview_question_progress;
create policy "own interview question progress" on public.kori_interview_question_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── Per-answer practice history ────────────────────────────────────────────
-- question_id is nullable: answers from the legacy static drill pool
-- (lib/interview-drills.ts, no stable ids) still get a full history row via
-- the question_ko snapshot, just without bank-linked progress tracking.
create table if not exists public.kori_interview_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid references public.kori_interview_questions(id) on delete set null,
  session_type text not null check (session_type in ('speaking_drill', 'listening_drill', 'mock_interview')),
  session_id text,
  question_ko text not null,
  answer_text text not null,
  answer_duration_seconds integer,
  confidence_self_score smallint check (confidence_self_score between 1 and 5),
  scores jsonb not null default '{}',
  feedback text,
  corrected_answer text,
  natural_alternative text,
  tip text,
  created_at timestamptz not null default now()
);

create index if not exists kori_interview_answers_user_created_idx
  on public.kori_interview_answers (user_id, created_at desc);
create index if not exists kori_interview_answers_user_question_idx
  on public.kori_interview_answers (user_id, question_id);
create index if not exists kori_interview_answers_user_session_idx
  on public.kori_interview_answers (user_id, session_id);

alter table public.kori_interview_answers enable row level security;
revoke all on table public.kori_interview_answers from anon;
grant select, insert, update, delete on table public.kori_interview_answers to authenticated;

drop policy if exists "own interview answers" on public.kori_interview_answers;
create policy "own interview answers" on public.kori_interview_answers
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── Script version snapshots ────────────────────────────────────────────────
-- Layered on top of kori_interview_scripts, which stays the live autosaving
-- draft (app/(main)/interview/script/page.tsx). This table only holds
-- point-in-time snapshots the candidate explicitly saves under a label
-- (Original / Script V1 / Mentor Correction / Final Practice Version / ...).
-- "Only one active version at a time" is enforced by the app layer (unset the
-- previous active row, then insert/update the new one) rather than a partial
-- unique index, to avoid cross-row-transaction complexity for what is always
-- a single-user, low-frequency write.
create table if not exists public.kori_interview_script_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null default 'weather',
  version_label text not null check (char_length(version_label) between 1 and 80),
  source_type text not null default 'user' check (source_type in ('user', 'ai', 'mentor')),
  sections jsonb not null default '{}',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists kori_interview_script_versions_user_topic_idx
  on public.kori_interview_script_versions (user_id, topic_id, created_at desc);

alter table public.kori_interview_script_versions enable row level security;
revoke all on table public.kori_interview_script_versions from anon;
grant select, insert, update, delete on table public.kori_interview_script_versions to authenticated;

drop policy if exists "own interview script versions" on public.kori_interview_script_versions;
create policy "own interview script versions" on public.kori_interview_script_versions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
