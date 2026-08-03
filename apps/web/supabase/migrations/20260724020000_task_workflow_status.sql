-- Task workflow status: a real state machine alongside the legacy `completed`
-- boolean.
--
-- `tasks` is one of Orbit's original shared tables, so this stays additive and
-- the legacy boolean stays authoritative-on-read until every external writer is
-- known to set `status` too. The canonical synchronisation rule (and the exit
-- criteria for dropping `completed`) is implemented and documented in
-- lib/task-status.ts; see docs/goal-planning-scheduling-audit.md §11.

alter table public.tasks
  add column if not exists status text not null default 'backlog'
    check (status in ('backlog', 'scheduled', 'in_progress', 'blocked', 'completed')),
  add column if not exists blocked_reason text;

-- Backfill, once, for rows still sitting on the column default:
--   completed                         → completed
--   incomplete, dated today or later  → scheduled
--   everything else                   → backlog
--
-- `overdue` is deliberately NOT a status: it's derived from
-- (status is not completed) AND (end date < now), so it can never go stale.
-- The `where` clause makes this idempotent — a re-run won't stomp statuses a
-- user has since set by hand.
update public.tasks
set status = case
  when completed then 'completed'
  when end_date is not null and end_date::date >= current_date then 'scheduled'
  else 'backlog'
end
where status = 'backlog'
  and (completed or (end_date is not null and end_date::date >= current_date));

create index if not exists tasks_status_idx on public.tasks (goal_id, status);
