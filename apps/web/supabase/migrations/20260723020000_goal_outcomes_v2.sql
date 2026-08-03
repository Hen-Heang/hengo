-- Goal System v2: outcome-based goals (key results, evidence, reviews).
--
-- goals/tasks/goal_members/goal_stars/notifications are Orbit's original
-- tables, shared with this Supabase project (see lib/supabase.ts,
-- lib/api/goals.ts) — there is no prior local migration for them. Everything
-- below is additive: new nullable/defaulted columns on goals/tasks (existing
-- Orbit reads of `select *` or named columns are unaffected), plus three new
-- kori-app-owned tables. Nothing existing is renamed, dropped, or narrowed.
--
-- See docs/goal-system-v2-audit.md for the full audit this migration
-- implements, and docs/account-reconciliation-plan.md for the separate,
-- unrelated identity-cleanup question (not touched by this migration).

-- ── goals: outcome fields ────────────────────────────────────────────────
alter table public.goals
  add column if not exists outcome_statement text,
  add column if not exists motivation text,
  add column if not exists baseline_summary text,
  add column if not exists success_definition text,
  add column if not exists weekly_capacity_minutes integer check (weekly_capacity_minutes is null or weekly_capacity_minutes >= 0),
  add column if not exists review_frequency text check (review_frequency in ('weekly', 'biweekly', 'monthly')),
  add column if not exists outcome_progress numeric(5, 2) not null default 0
    check (outcome_progress >= 0 and outcome_progress <= 100),
  add column if not exists health_status text not null default 'not_started'
    check (health_status in ('on_track', 'attention', 'at_risk', 'blocked', 'completed', 'not_started')),
  add column if not exists health_reason text,
  add column if not exists last_reviewed_at timestamptz;

-- ── goal_key_results ─────────────────────────────────────────────────────
create table if not exists public.goal_key_results (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  metric_type text not null
    check (metric_type in ('number', 'percentage', 'score', 'boolean', 'count', 'duration', 'external', 'manual_evidence')),
  baseline_value numeric,
  current_value numeric,
  target_value numeric,
  unit text,
  weight numeric not null default 1 check (weight > 0),
  deadline timestamptz,
  data_source text not null default 'manual'
    check (data_source in (
      'manual', 'task_completion', 'hengo_learning_metric', 'interview_score',
      'skill_mastery', 'activity_session', 'external_integration'
    )),
  source_config jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'achieved', 'missed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_key_results_goal_idx on public.goal_key_results (goal_id);
create index if not exists goal_key_results_user_idx on public.goal_key_results (user_id);

alter table public.goal_key_results enable row level security;
revoke all on table public.goal_key_results from anon;
grant select, insert, update, delete on table public.goal_key_results to authenticated;

drop policy if exists "own goal key results" on public.goal_key_results;
create policy "own goal key results" on public.goal_key_results
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── goal_evidence ────────────────────────────────────────────────────────
-- Text/URL/numeric evidence only in this phase — no file uploads (see audit).
create table if not exists public.goal_evidence (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  key_result_id uuid references public.goal_key_results(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  evidence_type text not null
    check (evidence_type in (
      'note', 'link', 'git_commit', 'pull_request', 'deployment', 'score',
      'transcript', 'recording_reference', 'screenshot_reference', 'completed_project_output'
    )),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  url text,
  numeric_value numeric,
  metadata jsonb not null default '{}',
  verified_status text not null default 'unverified'
    check (verified_status in ('unverified', 'self_confirmed', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_evidence_goal_idx on public.goal_evidence (goal_id);
create index if not exists goal_evidence_key_result_idx on public.goal_evidence (key_result_id);
create index if not exists goal_evidence_user_idx on public.goal_evidence (user_id);

alter table public.goal_evidence enable row level security;
revoke all on table public.goal_evidence from anon;
grant select, insert, update, delete on table public.goal_evidence to authenticated;

drop policy if exists "own goal evidence" on public.goal_evidence;
create policy "own goal evidence" on public.goal_evidence
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── goal_reviews ─────────────────────────────────────────────────────────
-- ai_summary is only ever written after an explicit user action (see
-- app/api/ai/goals/* conventions) — never populated as a side effect of
-- saving the review itself.
create table if not exists public.goal_reviews (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  review_period_start timestamptz not null,
  review_period_end timestamptz not null,
  outcome_progress_before numeric(5, 2),
  outcome_progress_after numeric(5, 2),
  wins text,
  blockers text,
  lessons text,
  next_focus text,
  ai_summary text,
  created_at timestamptz not null default now()
);

create index if not exists goal_reviews_goal_idx on public.goal_reviews (goal_id, review_period_start desc);
create index if not exists goal_reviews_user_idx on public.goal_reviews (user_id);

alter table public.goal_reviews enable row level security;
revoke all on table public.goal_reviews from anon;
grant select, insert, update, delete on table public.goal_reviews to authenticated;

drop policy if exists "own goal reviews" on public.goal_reviews;
create policy "own goal reviews" on public.goal_reviews
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── tasks: key-result linkage + quality fields ───────────────────────────
alter table public.tasks
  add column if not exists key_result_id uuid references public.goal_key_results(id) on delete set null,
  add column if not exists expected_output text,
  add column if not exists completion_criteria text,
  add column if not exists evidence_required boolean not null default false,
  add column if not exists impact_level text check (impact_level is null or impact_level in ('low', 'medium', 'high')),
  add column if not exists effort_minutes integer check (effort_minutes is null or effort_minutes >= 0),
  add column if not exists source text not null default 'manual' check (source in ('manual', 'ai', 'template')),
  add column if not exists reschedule_count integer not null default 0 check (reschedule_count >= 0);

create index if not exists tasks_key_result_idx on public.tasks (key_result_id);
