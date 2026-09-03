-- Performance: remove per-row auth.uid() re-evaluation and duplicate permissive policies.
--
-- Two distinct problems, both flagged by the Supabase performance linter:
--
--   1. auth_rls_initplan (10 policies) - a bare `auth.uid()` in a policy is
--      re-evaluated once per row. Wrapping it as `(select auth.uid())` lets the
--      planner hoist it into an InitPlan and evaluate it once per query.
--
--   2. multiple_permissive_policies (16 combinations) - the four kori_focus_*
--      tables carry a legacy `<table>_owner` policy (permissive, ALL, role
--      `public`) *and* the per-action policies introduced by
--      20260719045208_recovery_workspace. Postgres evaluates every permissive
--      policy for every row, so the legacy one costs a second scan of the same
--      predicate on each of SELECT/INSERT/UPDATE/DELETE.
--
-- Dropping the legacy `_owner` policies does not widen or narrow access. The
-- recovery_workspace migration deliberately layered a RESTRICTIVE
-- `<table>_owner_guard` over them ("ensures ownership still applies if a
-- pre-existing permissive policy is broader than intended"), and a restrictive
-- policy is ANDed with the permissive set. The guard already enforces
-- `user_id = auth.uid()` (plus habit ownership on events/plans), so it, not the
-- legacy policy, is the binding constraint. This migration is the follow-through
-- that removes the now-redundant layer.
--
-- The `_owner` policies were granted to role `public` rather than
-- `authenticated`, but `anon` never had usable access through them:
-- `auth.uid()` is NULL for anon, so `user_id = auth.uid()` yields NULL and
-- matches no rows. `service_role` and `postgres` bypass RLS entirely.

-- 1. Drop the redundant legacy owner policies on the focus tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'kori_focus_habits',
    'kori_focus_triggers',
    'kori_focus_events',
    'kori_focus_plans'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_owner', table_name);
  end loop;
end
$$;

-- 2. Rebuild the remaining policies with an InitPlan-friendly `(select auth.uid())`.
--    Role and predicate are otherwise preserved exactly as they were.

-- kori_habits / kori_habit_checkins: single ALL policy, role `public`.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['kori_habits', 'kori_habit_checkins']
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_owner', table_name);
    execute format(
      'create policy %I on public.%I for all to public using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      table_name || '_owner', table_name
    );
  end loop;
end
$$;

-- kori_interview_attempts: per-action policies, role `authenticated`.
-- There is intentionally no UPDATE policy; attempts are append-only.
drop policy if exists "Users select own interview attempts" on public.kori_interview_attempts;
create policy "Users select own interview attempts"
  on public.kori_interview_attempts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own interview attempts" on public.kori_interview_attempts;
create policy "Users insert own interview attempts"
  on public.kori_interview_attempts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own interview attempts" on public.kori_interview_attempts;
create policy "Users delete own interview attempts"
  on public.kori_interview_attempts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- kori_google_calendar_integrations: read-only metadata policy.
-- Writes stay service-role only, so no other policy is added here.
drop policy if exists "Users can view their own Google Calendar connection metadata"
  on public.kori_google_calendar_integrations;
create policy "Users can view their own Google Calendar connection metadata"
  on public.kori_google_calendar_integrations
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 3. Pin the search_path on the one function still missing it.
--    Not SECURITY DEFINER, so this is hygiene rather than a privilege fix.
alter function public.kori_next_reminder_run(jsonb, text, timestamptz)
  set search_path = pg_catalog, public;
