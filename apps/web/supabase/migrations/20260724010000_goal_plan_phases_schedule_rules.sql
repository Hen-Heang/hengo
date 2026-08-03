-- Goal Planning & Scheduling: plan phases, schedule rules, task scheduling
-- linkage.
--
-- Fully additive, same posture as 20260723020000_goal_outcomes_v2.sql:
-- `goals`/`tasks` are Orbit's original shared tables, so nothing here renames,
-- drops, or narrows an existing column — new task columns are all nullable or
-- defaulted, and the two new tables are owned by this app.
--
-- See docs/goal-planning-scheduling-audit.md for the audit this implements.

-- ── goal_plan_phases ─────────────────────────────────────────────────────
-- An ordered stage of a goal's plan. Replaces the user-facing "Sub-goals"
-- concept (goals.metadata.milestones), which is NOT deleted — legacy
-- milestones stay readable and are converted only on explicit user action
-- (see lib/goal-plan-phases.ts `milestonesToPhaseDrafts`).
create table if not exists public.goal_plan_phases (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  objective text,
  description text,
  position integer not null default 0 check (position >= 0),
  start_date date,
  end_date date,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_plan_phases_date_order
    check (start_date is null or end_date is null or end_date >= start_date)
);

create index if not exists goal_plan_phases_goal_idx
  on public.goal_plan_phases (goal_id, position);
create index if not exists goal_plan_phases_user_idx on public.goal_plan_phases (user_id);

alter table public.goal_plan_phases enable row level security;
revoke all on table public.goal_plan_phases from anon;
grant select, insert, update, delete on table public.goal_plan_phases to authenticated;

drop policy if exists "own goal plan phases" on public.goal_plan_phases;
create policy "own goal plan phases" on public.goal_plan_phases
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── goal_schedule_rules ──────────────────────────────────────────────────
-- A recurring commitment ("Mon/Wed/Fri 07:00, 45 min"). Occurrences are
-- materialised into `tasks` on an explicit user action ("Create next 14
-- days") — there is no cron job in this implementation (see the audit doc's
-- "Deferred" section).
create table if not exists public.goal_schedule_rules (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  phase_id uuid references public.goal_plan_phases(id) on delete set null,
  key_result_id uuid references public.goal_key_results(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  recurrence_type text not null check (recurrence_type in ('daily', 'weekly', 'monthly')),
  recurrence_interval integer not null default 1 check (recurrence_interval >= 1),
  days_of_week smallint[],
  day_of_month smallint check (day_of_month is null or (day_of_month between 1 and 31)),
  start_time time,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  start_date date not null,
  end_date date,
  timezone text not null default 'Asia/Seoul',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_schedule_rules_date_order
    check (end_date is null or end_date >= start_date),
  -- Every weekday value must be 0 (Sunday) … 6 (Saturday).
  constraint goal_schedule_rules_days_of_week_range check (
    days_of_week is null
    or (
      array_length(days_of_week, 1) is not null
      and 0 <= all (days_of_week)
      and 6 >= all (days_of_week)
    )
  ),
  -- Weekly recurrence needs at least one weekday; monthly needs a day-of-month.
  constraint goal_schedule_rules_weekly_requires_days check (
    recurrence_type <> 'weekly'
    or (days_of_week is not null and array_length(days_of_week, 1) >= 1)
  ),
  constraint goal_schedule_rules_monthly_requires_day check (
    recurrence_type <> 'monthly' or day_of_month is not null
  )
);

create index if not exists goal_schedule_rules_goal_idx
  on public.goal_schedule_rules (goal_id, active);
create index if not exists goal_schedule_rules_user_idx on public.goal_schedule_rules (user_id);
create index if not exists goal_schedule_rules_phase_idx on public.goal_schedule_rules (phase_id);

alter table public.goal_schedule_rules enable row level security;
revoke all on table public.goal_schedule_rules from anon;
grant select, insert, update, delete on table public.goal_schedule_rules to authenticated;

drop policy if exists "own goal schedule rules" on public.goal_schedule_rules;
create policy "own goal schedule rules" on public.goal_schedule_rules
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── tasks: plan / schedule linkage ───────────────────────────────────────
alter table public.tasks
  add column if not exists phase_id uuid references public.goal_plan_phases(id) on delete set null,
  add column if not exists schedule_rule_id uuid references public.goal_schedule_rules(id) on delete set null,
  add column if not exists occurrence_date date,
  add column if not exists scheduling_source text not null default 'manual'
    check (scheduling_source in ('manual', 'ai', 'recurring_rule', 'rescheduled'));

create index if not exists tasks_phase_idx on public.tasks (phase_id);
create index if not exists tasks_schedule_rule_idx on public.tasks (schedule_rule_id);

-- Idempotency for generated recurring occurrences: one task per (rule, date).
-- Partial so the millions of pre-existing rows with a null schedule_rule_id
-- are unaffected and can never collide.
create unique index if not exists tasks_schedule_rule_occurrence_uniq
  on public.tasks (schedule_rule_id, occurrence_date)
  where schedule_rule_id is not null and occurrence_date is not null;
