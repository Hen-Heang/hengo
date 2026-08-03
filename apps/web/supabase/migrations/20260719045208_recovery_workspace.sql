-- Additive Recovery workspace expansion. Existing kori_focus_* names are kept
-- because they contain live user data from before the workspace rename.

alter table public.kori_focus_habits
  add column if not exists tracking_mode text not null default 'awareness'
    check (tracking_mode in ('abstinence', 'frequency_reduction', 'time_reduction', 'personal_limit', 'awareness')),
  add column if not exists recovery_statement text,
  add column if not exists reasons text[] not null default '{}',
  add column if not exists baseline jsonb,
  add column if not exists personal_limit numeric,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.kori_focus_triggers
  add column if not exists category text not null default 'situation'
    check (category in ('emotion', 'time', 'location', 'device', 'content_source', 'situation', 'sleep', 'stress', 'social_connection', 'previous_activity')),
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.kori_focus_events
  add column if not exists location text,
  add column if not exists device text,
  add column if not exists situation text,
  add column if not exists previous_activity text,
  add column if not exists sleep_quality smallint check (sleep_quality between 1 and 5),
  add column if not exists stress_level smallint check (stress_level between 1 and 5),
  add column if not exists healthy_action_completed boolean,
  add column if not exists resolved_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.kori_focus_plans
  add column if not exists active boolean not null default true,
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.kori_focus_daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.kori_focus_habits(id) on delete cascade,
  local_date date not null,
  period text not null check (period in ('morning', 'evening', 'minimal')),
  mood text,
  sleep_quality smallint check (sleep_quality between 1 and 5),
  energy smallint check (energy between 1 and 5),
  stress smallint check (stress between 1 and 5),
  risk_level smallint check (risk_level between 1 and 5),
  important_goal text,
  protection_action text,
  intention text,
  current_urge smallint check (current_urge between 1 and 10),
  strongest_urge smallint check (strongest_urge between 1 and 10),
  coping_strategy text,
  healthy_habits_completed text[] not null default '{}',
  target_occurred boolean,
  lesson text,
  win text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, local_date, period)
);

create table if not exists public.kori_focus_protection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.kori_focus_habits(id) on delete cascade,
  category text not null check (category in ('phone', 'computer', 'daily_environment')),
  label text not null check (char_length(label) between 1 and 160),
  status text not null default 'not_set'
    check (status in ('not_set', 'planned', 'active', 'needs_improvement')),
  preferred_action boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, category, label)
);

create table if not exists public.kori_focus_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.kori_focus_habits(id) on delete cascade,
  week_start date not null,
  statistics jsonb not null default '{}',
  summary text,
  experiment text,
  ai_summary text,
  ai_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, week_start)
);

create table if not exists public.kori_focus_support_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  contact_method text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kori_focus_privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lock_enabled boolean not null default false,
  discreet_notifications boolean not null default true,
  custom_notification_text text,
  quiet_hours_start time,
  quiet_hours_end time,
  morning_reminder boolean not null default false,
  evening_reminder boolean not null default false,
  risk_time_reminder boolean not null default false,
  bedtime_reminder boolean not null default false,
  weekly_review_reminder boolean not null default false,
  ai_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kori_focus_habits_user_active_idx
  on public.kori_focus_habits (user_id, active, created_at desc);
create index if not exists kori_focus_triggers_user_category_idx
  on public.kori_focus_triggers (user_id, category, created_at desc);
create index if not exists kori_focus_events_user_habit_occurred_idx
  on public.kori_focus_events (user_id, habit_id, occurred_at desc);
create index if not exists kori_focus_events_user_kind_occurred_idx
  on public.kori_focus_events (user_id, kind, occurred_at desc);
create index if not exists kori_focus_plans_user_habit_review_idx
  on public.kori_focus_plans (user_id, habit_id, next_review);
create index if not exists kori_focus_daily_checkins_user_date_idx
  on public.kori_focus_daily_checkins (user_id, local_date desc);
create index if not exists kori_focus_protection_items_user_habit_idx
  on public.kori_focus_protection_items (user_id, habit_id, sort_order);
create index if not exists kori_focus_weekly_reviews_user_week_idx
  on public.kori_focus_weekly_reviews (user_id, week_start desc);
create index if not exists kori_focus_support_contacts_user_active_idx
  on public.kori_focus_support_contacts (user_id, active);

alter table public.kori_focus_habits enable row level security;
alter table public.kori_focus_triggers enable row level security;
alter table public.kori_focus_events enable row level security;
alter table public.kori_focus_plans enable row level security;
alter table public.kori_focus_daily_checkins enable row level security;
alter table public.kori_focus_protection_items enable row level security;
alter table public.kori_focus_weekly_reviews enable row level security;
alter table public.kori_focus_support_contacts enable row level security;
alter table public.kori_focus_privacy_settings enable row level security;

revoke all on table public.kori_focus_habits from anon;
revoke all on table public.kori_focus_triggers from anon;
revoke all on table public.kori_focus_events from anon;
revoke all on table public.kori_focus_plans from anon;
revoke all on table public.kori_focus_daily_checkins from anon;
revoke all on table public.kori_focus_protection_items from anon;
revoke all on table public.kori_focus_weekly_reviews from anon;
revoke all on table public.kori_focus_support_contacts from anon;
revoke all on table public.kori_focus_privacy_settings from anon;

grant select, insert, update, delete on table public.kori_focus_habits to authenticated;
grant select, insert, update, delete on table public.kori_focus_triggers to authenticated;
grant select, insert, update, delete on table public.kori_focus_events to authenticated;
grant select, insert, update, delete on table public.kori_focus_plans to authenticated;
grant select, insert, update, delete on table public.kori_focus_daily_checkins to authenticated;
grant select, insert, update, delete on table public.kori_focus_protection_items to authenticated;
grant select, insert, update, delete on table public.kori_focus_weekly_reviews to authenticated;
grant select, insert, update, delete on table public.kori_focus_support_contacts to authenticated;
grant select, insert, update, delete on table public.kori_focus_privacy_settings to authenticated;

-- Owner-only policies. The restrictive guard ensures ownership still applies
-- if a pre-existing permissive policy is broader than intended.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'kori_focus_habits',
    'kori_focus_triggers',
    'kori_focus_support_contacts',
    'kori_focus_privacy_settings'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_owner_guard', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) is not null and (select auth.uid()) = user_id)',
      table_name || '_owner_guard', table_name
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_select_own', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      table_name || '_insert_own', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name || '_update_own', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_delete_own', table_name
    );
  end loop;
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'kori_focus_events',
    'kori_focus_plans',
    'kori_focus_daily_checkins',
    'kori_focus_protection_items',
    'kori_focus_weekly_reviews'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_owner_guard', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) is not null and (select auth.uid()) = user_id and exists (select 1 from public.kori_focus_habits h where h.id = habit_id and h.user_id = (select auth.uid())))',
      table_name || '_owner_guard', table_name
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_select_own', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.kori_focus_habits h where h.id = habit_id and h.user_id = (select auth.uid())))',
      table_name || '_insert_own', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and exists (select 1 from public.kori_focus_habits h where h.id = habit_id and h.user_id = (select auth.uid())))',
      table_name || '_update_own', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      table_name || '_delete_own', table_name
    );
  end loop;
end
$$;
