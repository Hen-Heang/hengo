# Business-logic test audit — goals, tasks, scheduling

**Date:** 2026-07-24
**Scope of this pass:** the goals/tasks/scheduling domain (`lib/task-status.ts`,
`lib/task-views.ts`, `lib/weekly-capacity.ts`, `lib/goal-progress.ts`,
`lib/next-best-action.ts`, `lib/goal-schedule-rules.ts`, `lib/goal-plan-phases.ts`,
`lib/api/goals.ts`, and the Goal Detail components that render them).

**Not covered in this pass** — see [Remaining risks](#16-known-remaining-risks):
habits, recovery, learning/vocab progress, achievements, notifications, RLS,
and end-to-end flows. This document does not claim those are correct; it claims
they were not audited.

---

## 1. Domain areas found

| Area | Source of truth | Notes |
| --- | --- | --- |
| Task workflow status | `lib/task-status.ts` | 5 statuses + legacy `completed` boolean |
| Derived task state (overdue / today / unscheduled) | `lib/task-status.ts` | Derived, never stored |
| Task filtering, search, sorting, grouping | `lib/task-views.ts` | Pure, clock injected |
| Weekly capacity + conflicts | `lib/weekly-capacity.ts` | `goals.weekly_capacity_minutes` |
| Goal progress (outcome vs activity) | `lib/goal-progress.ts` | Weighted key results |
| Goal health | `lib/goal-health.ts` | Not re-audited this pass |
| Next Best Action | `lib/next-best-action.ts` | Deterministic, 6 ordered rules |
| Recurring occurrences | `lib/goal-schedule-rules.ts` | Civil dates, UTC-anchored |
| Phases | `lib/goal-plan-phases.ts` | Ordering + status |
| Task mutations | `lib/api/goals.ts` (`tasksApi`) | The only write path |

The domain layer is genuinely well-factored: it is pure, has no React or
Supabase coupling, and injects "today" as a civil date rather than reading the
clock. **This audit found no duplicated progress calculation and no duplicated
Next-Best-Action selector** — `OverviewTab` calls `selectNextBestAction`
directly rather than reimplementing it. That is unusual and worth preserving.

## 2. Canonical business rules confirmed

These were read from source, traced to their consumers, and are now covered by
tests:

1. **Status/completed sync.** `completed` wins on read when the two disagree
   (`resolveTaskStatus`), because Orbit can only flip the boolean. Every write
   emits both, via `taskStatusPatch` / `taskCompletionPatch`.
2. **"Today" is the Asia/Seoul civil date**, never the host's
   (`todayInAppTimezone`). Verified across the Seoul midnight boundary, month,
   year and leap-day boundaries, and from four host timezones.
3. **Overdue / due-today / unscheduled are derived, never stored.**
4. **"Unscheduled" means no *time slot*** (`hasTimeSlot`), not "no date".
5. **`reschedule_count` means "times this slipped"**, not "times it was
   edited" — only `tasksApi.reschedule` bumps it.
6. **Occurrence generation is timezone-independent and idempotent**; months too
   short for `day_of_month` are skipped, never clamped.
7. **Outcome progress ≠ activity progress.** `outcomeProgress` is `null` (not
   0) when a goal has no key results; callers must not render null as 0%.
8. **Progress clamps to [0, 100].**

## 3–5. Conflicting sources of truth, duplicated calculations, untested logic

### C1 — "Unscheduled" had two contradictory definitions ✅ FIXED

The headline finding. Two rules coexisted:

| Definition | Used by |
| --- | --- |
| **No time slot** (`isTaskUnscheduled` / `hasTimeSlot`) | Unscheduled chip + count, `filters.scheduled`, Schedule tab's "Unscheduled backlog", Plan tab's per-phase `unscheduledCount`, Overview's "Unscheduled" stat, capacity `unscheduledCount` |
| **No due date** (`dueDate ?? "Unscheduled"`) | `GoalTaskRow` (both variants), `GoalTaskDetailsSheet` header |

`tasksApi.moveToBacklog` **deliberately keeps the task's day and drops only the
slot**. So every backlogged task still had a date, and the date-based rule never
fired: the Unscheduled chip could read `3` while **not one row was labelled
Unscheduled**. Worse, the row's status badge read *"Scheduled"* (see C2).

### C2 — `moveToBacklog` never wrote the status ✅ FIXED

`moveToBacklog` cleared the time fields but wrote no `status`, so a task that
had been `scheduled` kept that status forever. Consequences:

- The row badge said **"Scheduled"** for a task sitting in the Unscheduled backlog.
- Filtering by status `scheduled` still returned backlogged tasks.
- The status filter and the schedule filter disagreed about the same task.

### C3 — Weekly capacity counts unscheduled work as planned ⚠️ OPEN

`summarizeWeek` adds **every** task whose `start_date` falls in the week to
`plannedMinutes` — including tasks with no time slot, which the same summary
simultaneously reports in `unscheduledCount`. A goal can therefore display
**"Over capacity"** driven by work the very same card lists as *not yet
scheduled*, and moving a task to the backlog does not reduce the week's load.

Not changed in this pass: it alters a user-visible number and the product must
choose. Pinned by characterisation tests in `lib/weekly-capacity.test.ts`
("capacity: what counts as 'planned'") so any future change is deliberate and
visible in a diff.

**Recommendation:** capacity should count *scheduled* effort — filter on
`isScheduled(task)` in the `plannedMinutes` loop.

### C4 — Week bucketing uses `start_date`, due-date logic uses `end_date` ⚠️ OPEN

`taskDueDate` is `end_date ?? start_date`; `summarizeWeek` and
`findScheduleConflicts` are `start_date`-only. Identical for single-day tasks
(the overwhelming majority), divergent for multi-day ones. Pinned by a
characterisation test. Low severity; documented rather than changed.

### C5 — `deriveStatusFromSchedule` ignores the time slot ⚠️ OPEN

It returns `"scheduled"` for any task with a future date, whether or not it has
a slot — so it disagrees with `hasTimeSlot`. This is **intentional**: the
comment states it mirrors the SQL backfill in
`20260724020000_task_workflow_status.sql` exactly. Changing it would desync code
from the migration. Only reachable for rows with no stored `status`
(pre-migration legacy rows). Documented, not changed.

## 6. Unsafe date handling

None found in the audited modules — and this was checked specifically.
`lib/goal-schedule-rules.ts` routes all arithmetic through `Date.UTC` and never
calls `getFullYear`/`getMonth`/`getDate` or builds a `Date` from a local-time
string, so its output is identical in every runtime timezone (and inherently
DST-safe). `todayInAppTimezone` uses `TZDate`; `dateKeyInTimeZone` uses
`Intl.DateTimeFormat` with an explicit zone and falls back safely on an invalid
IANA name. Now covered by explicit host-timezone-sweep tests.

## 7. Database/frontend naming inconsistencies

`tasks` rows are consumed as snake_case throughout the goals domain rather than
mapped to camelCase like other domains (`lib/api/*` generally maps). This is
deliberate — the table is shared with Orbit — but it is an inconsistency with
the rest of `lib/api`. No action.

## 8. UI labels not backed by actual state

C1 and C2 above were exactly this class of defect, and both are fixed and
regression-tested. Now proven by component tests:

- stored `blocked` → both variants render "Blocked" **and** the blocked reason
- past-due open task → both variants render "Overdue"
- completed past-due task → neither renders "Overdue"
- legacy `completed: true` + stale `status: in_progress` → both render "Completed"
- completion control `aria-pressed` matches stored completion
- `evidence_required: false` → neither variant claims evidence

## 9. Legacy compatibility risks

The `completed`/`status` dual-write is the main one, and it is well handled and
now well tested. `lib/task-status.ts` documents the exact three preconditions
for dropping the boolean. Tasks with no `status` at all fall back to
`deriveStatusFromSchedule` and do not crash.

## 10–12. Authorization, race-condition and optimistic-update risks

- **Authorization:** not tested this pass (no local Supabase available). All
  access relies on RLS + `auth.uid()`; no service key is used anywhere, and
  `requireUser` in `lib/server/ai.ts` returns a per-request RLS-scoped client.
  Design is sound; **unverified**.
- **Optimistic updates:** none exist. `useGoalTaskActions` awaits the mutation,
  then calls `onChanged()` to refetch. No rollback path is needed because no
  optimistic state is written. Errors surface via `toast.error` and no success
  toast is shown on failure.
- **Race conditions:** occurrence generation relies on frontend duplicate
  checking; there is no unique DB constraint on
  `(schedule_rule_id, occurrence_date)`. Two near-simultaneous generations could
  duplicate. **Open risk** — see §16.

## 13. Traceability

| Business rule | Source file | UI surface | Test level | Test file | Status |
| --- | --- | --- | --- | --- | --- |
| `completed` wins over `status` on read | `lib/task-status.ts` | Row, sheet | Unit + Component | `lib/task-status.test.ts`, `GoalTaskRow.test.tsx` | Verified |
| Writes always emit both fields | `lib/api/goals.ts` | — | Integration | `lib/api/goals-tasks.test.ts` | Verified |
| Blocked reason cleared on leaving blocked | `lib/task-status.ts` | Sheet | Integration | `lib/api/goals-tasks.test.ts` | Verified |
| "Today" = Asia/Seoul civil date | `lib/task-status.ts` | All | Unit | `lib/task-status.test.ts` | Verified |
| Overdue derived, excludes completed | `lib/task-status.ts` | Row, sheet | Unit + Component | both | Verified |
| Unscheduled = no time slot | `lib/task-status.ts` | Row, sheet, chips, Schedule tab | Unit + Component | both | Verified |
| `moveToBacklog` → status `backlog` | `lib/api/goals.ts` | Row menu, sheet | Integration | `lib/api/goals-tasks.test.ts` | Verified |
| `moveToBacklog` keeps the day | `lib/api/goals.ts` | Calendar | Integration | `lib/api/goals-tasks.test.ts` | Verified |
| `reschedule_count` = slips only | `lib/api/goals.ts` | Sheet footer | Integration | `lib/api/goals-tasks.test.ts` | Verified |
| Reopen derives status from schedule | `lib/task-status.ts` | Row checkbox | Integration | `lib/api/goals-tasks.test.ts` | Verified |
| Errors throw, never partial success | `lib/api/goals.ts` | Toast | Integration | `lib/api/goals-tasks.test.ts` | Verified |
| Mobile/desktop show same state | `GoalTaskRow.tsx` | Both variants | Component | `GoalTaskRow.test.tsx` | Verified |
| Capacity: zero ≠ unset | `lib/weekly-capacity.ts` | Overview stat | Unit | `lib/weekly-capacity.test.ts` | Verified |
| Capacity counts unscheduled as planned | `lib/weekly-capacity.ts` | Overview stat | Unit (characterisation) | `lib/weekly-capacity.test.ts` | **Pinned, not endorsed** |
| Week bucketing by `start_date` | `lib/weekly-capacity.ts` | Overview stat | Unit (characterisation) | `lib/weekly-capacity.test.ts` | **Pinned, not endorsed** |
| Week start / boundaries timezone-safe | `lib/weekly-capacity.ts` | Overview | Unit | `lib/weekly-capacity.test.ts` | Verified |
| Outcome progress null ≠ 0 | `lib/goal-progress.ts` | Cards, Progress tab | Unit | `lib/goal-progress.test.ts` (pre-existing) | Verified |
| Occurrence generation deterministic | `lib/goal-schedule-rules.ts` | Schedule tab | Unit | `lib/goal-schedule-rules.test.ts` (pre-existing) | Verified |
| Next Best Action deterministic | `lib/next-best-action.ts` | Overview card | Unit | `lib/next-best-action.test.ts` (pre-existing) | Verified |
| RLS user isolation | Supabase policies | All | — | — | **Not testable in current environment** |
| Occurrence uniqueness under concurrency | migrations | Schedule tab | — | — | **Not testable in current environment** |

## 14. Bugs found

1. **Backlogged tasks were never labelled "Unscheduled"** (C1) — every surface
   that counted them disagreed with every surface that rendered them.
2. **`moveToBacklog` left a stale `scheduled` status** (C2) — the row badge
   contradicted the row's own schedule column, and status filtering was wrong.

Both are user-visible and both were reachable through the primary
"Move to backlog" action available in the row overflow menu and the details sheet.

## 15. Fixes implemented

- `lib/task-status.ts` — added `taskScheduleDisplay()`, the single schedule
  label, derived from `isTaskUnscheduled` so it cannot drift from the chip. The
  day is retained alongside the word ("Unscheduled · 2026-07-25") so no
  information is lost.
- `components/.../GoalTaskRow.tsx`, `GoalTaskDetailsSheet.tsx` — both now render
  `taskScheduleDisplay().label` instead of their own `dueDate ?? "Unscheduled"`.
- `lib/api/goals.ts` — `moveToBacklog` now spreads `taskStatusPatch("backlog")`,
  which also mirrors `completed` per the canonical rule.

Both fixes were verified to **fail** before the change and pass after
(see the final report).

## 16. Known remaining risks

| Risk | Severity | Note |
| --- | --- | --- |
| RLS / cross-user isolation untested | **High** | Needs a local Supabase or dedicated test project with two users |
| No DB uniqueness on `(schedule_rule_id, occurrence_date)` | **High** | Duplicate occurrences possible under concurrent generation; frontend-only dedupe |
| Capacity counts unscheduled work (C3) | Medium | Product decision required |
| Habits / recovery / learning / achievements / notifications | Medium | **Not audited** |
| Goal + key-result + phase CRUD lifecycle | Medium | Not audited this pass |
| No E2E coverage | Medium | Playwright installed but no specs exist |
| Cascade-delete behaviour unverified | Medium | Migrations not traced to FK `ON DELETE` |
| `deriveStatusFromSchedule` vs `hasTimeSlot` (C5) | Low | Intentional; mirrors SQL backfill |
| Week bucketing `start_date` vs `end_date` (C4) | Low | Only affects multi-day tasks |

## Test-environment safety

`lib/api/goals-tasks.test.ts` mutates task rows. It:

- replaces `@/lib/supabase` with an in-memory fake **before** importing the
  module under test, so no network client is ever constructed;
- calls `assertNoLiveDatabase()` at load, which throws unless
  `NEXT_PUBLIC_SUPABASE_URL` is unset, points at localhost/127.0.0.1/[::1], or
  `SUPABASE_TEST_PROJECT=true` is explicitly set.

No test in this repo connects to production. No RLS policy was weakened, no
credential is referenced, and no migration was run.
