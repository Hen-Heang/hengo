# Goal Planning & Scheduling — audit and redesign

Audit of the Goal Detail planning/scheduling experience, and the changes made
in this pass. Everything in §1 was verified by reading the code at the commit
this document was written against (`394c61f`), not assumed. Companion to
`docs/goal-system-v2-audit.md`, which covered outcomes/key results/evidence.

## 1. Confirmed problems

All twelve issues named in the brief were checked against the code. Result:
**all twelve confirmed**, with the specifics below.

1. **No first-class Plan or Schedule workflow.** `app/(main)/goals/[id]/page.tsx`
   had exactly five tabs — `overview | tasks | members | coach | settings`
   (`type DetailTab`, line 86). There was no planning surface at all.
2. **The Tasks tab was a calendar, and only a calendar.** `TabsContent
   value="tasks"` rendered `<Calendar goalId … />` inside a
   `h-[clamp(420px,75dvh,700px)]` box and nothing else. A calendar answers
   "when", never "what" or "why" — there was no goal plan anywhere in the app.
3. **Task-level scheduling was already rich.** `tasks` carries `start_date`,
   `end_date`, `daily_start_time`, `daily_end_time`, `duration_minutes` and
   `is_anytime`, all wired through `TaskFormFields` / `AddTaskDialog` /
   `EditTaskDialog`. The primitives were there; the structure above them was not.
4. **No task recurrence.** Confirmed by grepping the repo: the only hits for
   "recurrence" were `lib/goals.ts` (a metadata type), `lib/goal-form.ts` (a
   Zod field) and `GoalFormContainer.tsx` (writing that field). No engine, no
   generator, no UI, no DB column.
5. **Goal recurrence was schema-only.** `goalSchema.recurrence`
   (`{ type, timeRange, daysOfWeek }`) existed in the Zod schema and was
   written into `metadata.recurrence` by `GoalFormContainer.handleSubmit` —
   but `GoalFormContainer` initialised it to `undefined` and **no step in the
   form ever set it**. Dead config with a live write path.
6. **Nothing consumed goal recurrence.** No reader anywhere in the repo.
7. **The AI switch was a lie.** `AdvancedStep` rendered "Generate daily action
   plan with AI" as a real `Switch`; `useGoalMutations.notifyAiSeam` responded
   with `toast.info("AI task generation is coming soon")`. Meanwhile a working
   generator route (`app/api/ai/goals/generate-tasks`) already existed and was
   reachable from a different screen.
8. **Goal dates never reached the Calendar.** `Calendar` accepts
   `goalStartDate` / `goalTargetDate` and `AddTaskDialog` uses them for
   `clampToGoalRange`, `dateOutOfRange` and the min/max on every date input —
   but Goal Detail rendered `<Calendar goalId goalTitle initialTaskId />` and
   passed neither. Every guard was dead code in the goal context.
9. **Overview was a scroll of cards.** Description → key results → Money Flow →
   milestones → timeline → learning metric → practice → SmartAnalytics, with
   no next action and no week view. Above it sat a ~300px hero plus four stat
   tiles, so the first screenful contained no decision.
10. **Key Results and Sub-goals were unexplained siblings.** `KeyResultsCard`
    ("what proves this goal is working") and `GoalMilestones` ("Sub-goals ·
    milestones") sat adjacent with no stated relationship. `docs/goal-system-v2-audit.md`
    §6 explicitly deferred reconciling them.
11. **Members and Settings held primary tab space.** Two of five tabs were
    management actions used rarely, competing with the work itself.
12. **No structured phases or scheduling rules.** `20260723020000_goal_outcomes_v2.sql`
    added outcome fields, key results, evidence, reviews and task-quality
    columns — and nothing about sequencing or recurrence. Confirmed by reading
    the migration in full.

Two further problems found while auditing, not in the brief:

13. **`lib/api/ai-client.ts` had a stray `~` inside `aiPost`** (`if (!res.ok) {~`),
    committed at `394c61f`. `npx tsc --noEmit` failed on it and `next build`
    could not have succeeded. Fixed in this pass (one character).
14. **AI tasks were written the instant the model replied.** `goalsApi.generateTasks`
    called the AI route and `insert`ed the result in the same function; the
    "Just added" list in `GoalCoach` was a receipt, not a review.

## 2. Product model

One vocabulary across UI, types, tables, API files and docs:

| Term | Meaning | Storage |
| --- | --- | --- |
| **Goal** | The final outcome | `goals` |
| **Key Result** | Measurable proof the outcome is happening | `goal_key_results` |
| **Phase** | An ordered stage of the plan | `goal_plan_phases` *(new)* |
| **Task** | A concrete action serving a phase or key result | `tasks` |
| **Schedule Rule** | A recurring commitment that materialises tasks | `goal_schedule_rules` *(new)* |
| **Evidence** | Proof of progress | `goal_evidence` |
| **Weekly Review** | Reflection and replanning | `goal_reviews` |

"Sub-goals" is retired as a user-facing term; the concept is now **Phases**.

## 3. Compatibility decisions

- **`metadata.milestones` is not deleted, and is not auto-converted.** It is
  marked `@deprecated` in `GoalMetadata`, still read, and the Plan tab offers a
  collapsible "Convert N existing checkpoints into plan phases" card that shows
  the exact drafts first. `planPhasesApi.convertMilestones` writes phases and
  deliberately leaves the original array untouched, so a regretted conversion
  loses nothing (the cost: a converted goal briefly holds both until the user
  clears the old list — an accepted, reversible duplication).
- **`metadata.recurrence` is legacy-read, never written.** The field stays in
  the `GoalMetadata` type (old goals must still parse) but was removed from
  `goalSchema` and from `GoalFormContainer`'s metadata build. Schedule rules
  are the authoritative model.
- **Every new DB object is additive.** No column renamed, dropped or narrowed;
  new task columns are nullable or defaulted; both new tables are app-owned.
  `goals`/`tasks` are shared with Orbit/DailyGoalMap, so this is the same
  posture as the v2 migration.
- **The task uniqueness index is partial** — `where schedule_rule_id is not
  null and occurrence_date is not null` — so the large body of existing tasks
  with null values can never collide.
- **Deleting a routine detaches its tasks rather than cascading.** Sessions you
  already did are history; a deleted rule shouldn't erase them. Same reasoning
  for deleting a phase (its tasks return to the backlog).
- **`reschedule_count` is bumped only by `tasksApi.reschedule`,** never by a
  plain `update` that happens to change dates, so the counter means "times
  this slipped".

## 4. Recurrence engine

`lib/goal-schedule-rules.ts` — pure, no I/O, no `Date.now()`.

- Every date is a bare `YYYY-MM-DD` **civil** date and all arithmetic runs
  through `Date.UTC`. Nothing calls `getFullYear`/`getMonth`/`getDate` or
  parses a local-time string, so output is identical in every runtime
  timezone — which is also what makes it DST-safe. Tested across a spring
  transition window even though Asia/Seoul has no DST today.
- The `timezone` column records the wall-clock zone `start_time` is meant in
  (default `Asia/Seoul`). It deliberately does **not** shift the civil dates:
  "every Monday" means Monday where the user lives, regardless of where the
  code runs.
- **Monthly rules skip short months rather than clamping.** The 31st in
  February is dropped, never moved to the 28th — a clamped date silently moves
  a commitment onto a day the user didn't choose.
- Output is sorted, deduplicated, clamped to the rule window *and* the goal
  window, and hard-capped at `MAX_OCCURRENCES = 200`.
- Generation is a **rolling 14-day window** behind an explicit "Create next 14
  days" button. Idempotent: existing `(schedule_rule_id, occurrence_date)` rows
  are read and skipped, with the partial unique index as the real guarantee if
  two clients race.

**Deferred: cron.** A scheduled generator (Supabase cron / Edge Function
calling the same pure engine with a service context) is the obvious next step.
It was left out of the first implementation on purpose: an automated writer
that creates tasks in a shared production project needs its own idempotency
review, a per-user opt-in, and a way to stop, none of which are worth guessing
at before the manual flow has been used.

## 5. Information architecture

Primary tabs are now **Overview · Plan · Schedule · Progress**.

- **AI Coach** moved from a tab to a right-hand `Sheet` (`CoachPanel`),
  reachable from the header's "Ask AI".
- **Members / Share / Settings** moved to a right-hand `ManagementPanel`,
  reachable from the overflow menu. **No collaboration functionality was
  removed** — invite, share code, leave, remove member, target date, archive
  and delete all still exist, in one place.
- The hero shrank from a ~300px gradient card + four stat tiles to a single
  band: back, icon, title, health, deadline, outcome progress, one health
  sentence, overflow menu, and three primary actions (Plan week / Add task /
  Ask AI). Supporting statistics live in Overview's "This week".

## 6. Deterministic Next Best Action

`lib/next-best-action.ts` — no AI in this version, so the reason shown to the
user is the rule that actually fired. Priority: overdue high-impact → task
feeding an at-risk key result (<50%) → task in the active phase → nearest
deadline → unscheduled high-impact → earliest scheduled. Ties break by due
date, then impact, then title, then id — never insertion order, which Supabase
doesn't promise. Today is injected as a `YYYY-MM-DD` argument so the function
is clock-independent and testable.

## 7. Weekly capacity

`lib/weekly-capacity.ts` reads `goals.weekly_capacity_minutes` (editable from
the Schedule tab). Effort per task is `effort_minutes ?? duration_minutes ?? 0`.
Status is `healthy` (<85%), `nearly_full` (85–100%), `over_capacity` (>100%),
`unset` (no capacity configured). **Being over capacity never blocks
scheduling** — it warns and explains, because the user knows things the app
doesn't. A task counts as *scheduled* only when it has a day *and* a time;
`is_anytime` tasks stay in the backlog for capacity purposes.

## 8. Reordering: buttons, not drag-and-drop

No drag-and-drop library is installed in this repo. Phase lists are typically
3–6 items, so accessible **Move up / Move down** buttons were chosen over
adding a DnD dependency plus the keyboard-accessibility work a custom
implementation would need. `movePhase` returns a full normalised 0..n-1
ordering and the API persists only the rows that actually changed.

## 9. Task workflow status, and retiring `completed`

`tasks.status` (`backlog | scheduled | in_progress | blocked | completed`) plus
`blocked_reason` were added in `20260724020000_task_workflow_status.sql`. The
legacy `completed` boolean is **kept** — `tasks` is shared with
Orbit/DailyGoalMap, which only knows about the boolean, so a stored `status`
can go stale behind our back.

**The canonical rule** (`lib/task-status.ts`, tested both directions):

- **Read** — `completed` wins whenever the two disagree. `resolveTaskStatus`
  returns `completed` if the boolean is true; otherwise it uses `status` unless
  `status` is a stale `completed`, in which case it re-derives from the
  schedule. An external writer can only flip the boolean, so trusting the enum
  over it would show a finished task as open (or vice versa).
- **Write** — never set one without the other. `taskStatusPatch` and
  `taskCompletionPatch` always emit both, and `tasksApi.setStatus` /
  `setCompleted` are the only sanctioned entry points.

**`overdue` is deliberately not a status.** It's derived from *(status is not
completed)* AND *(due date < today in Asia/Seoul)*, so it can never go stale
between writes.

**Migration mapping** (SQL backfill and `deriveStatusFromSchedule` mirror each
other exactly, and both are tested): completed → `completed`; incomplete and
dated today or later → `scheduled`; everything else → `backlog`. The backfill's
`where` clause makes a re-run idempotent — it won't stomp a status the user has
since set by hand.

**When `completed` can be dropped.** All three must hold: (1) no writer outside
this repo sets `tasks.completed`; (2) every write in this repo goes through the
two patch helpers — verifiable with `grep -rn "completed:" lib/api`; (3) a
backfill has run so no row has `completed <> (status = 'completed')`. Then drop
the column and delete `resolveTaskStatus`'s legacy branch. Until then the
boolean is load-bearing, not vestigial.

## 10. Task views, and the TanStack Table decision

**Today is Seoul's today.** `todayInAppTimezone` (`@date-fns/tz`) returns the
civil date in `Asia/Seoul`, and every filter, sort and derivation takes it as an
argument. Deriving "today" from the runtime's local date would mark a Seoul
user's tasks overdue a day early — or a day late on a UTC server. Tested at the
15:00 UTC boundary in both directions.

**Smart priority** (`lib/task-views.ts`, the default sort) buckets: overdue →
blocked high-impact → due today → scheduled high-impact → in the active phase →
other scheduled → unscheduled backlog → completed. Ties break by due date, then
impact, then title, then id — never insertion order, which Supabase doesn't
promise.

**No `@tanstack/react-table` in the first version.** The pipeline is memoised
pure functions (`buildTaskView` = filter → sort) feeding custom mobile cards and
a custom dense desktop list; server state stays in TanStack Query, filter state
in React state shared across both views. The library is installed and ready but
not wired.

*Migrate the desktop list to TanStack Table when the product needs:* bulk
selection, bulk status changes, bulk phase assignment, user-customisable
columns, server-side pagination, or multi-column sorting. When that happens,
`buildTaskView` becomes the table's data source and the column defs replace
`GoalTaskRow`'s `variant="row"` branch only. **Keep the custom mobile cards** —
the desktop table must never be rendered as a horizontally scrolling mobile
table.

*Not installed:* `dnd-kit` (add it when phase reordering moves to drag —
`movePhase` already returns a full normalised ordering, so the swap is
localised), `rrule`, `FullCalendar`.

## 11. Files changed

**New — domain (pure, tested):** `lib/goal-plan-phases.ts`,
`lib/goal-schedule-rules.ts`, `lib/weekly-capacity.ts`, `lib/next-best-action.ts`,
`lib/task-status.ts`, `lib/task-views.ts`.

**New — API:** `lib/api/goal-plan-phases.ts`, `lib/api/goal-schedule-rules.ts`
(both exported through `lib/api/index.ts`).

**New — UI:** `components/goals/detail/` — `GoalDetailHeader`, `OverviewTab`,
`PlanTab`, `PhaseDialog`, `ScheduleTab`, `ScheduleRuleDialog`, `ProgressTab`,
`CoachPanel`, `ManagementPanel`, `AiTaskPlanDialog`, and `detail/tasks/` —
`GoalTaskRow`, `GoalTaskDetailsSheet`, `AllTasksView`; `hooks/useGoalPlan.ts`,
`hooks/useGoalTaskActions.ts`.

**New — migrations:** `20260724010000_goal_plan_phases_schedule_rules.sql`,
`20260724020000_task_workflow_status.sql`.

**New — tests:** `lib/goal-plan-phases.test.ts`, `lib/goal-schedule-rules.test.ts`,
`lib/weekly-capacity.test.ts`, `lib/next-best-action.test.ts`,
`lib/task-status.test.ts`, `lib/task-views.test.ts` (136 cases).

**New — dependencies:** `@date-fns/tz` (used by `todayInAppTimezone`),
`@tanstack/react-table` (installed, deliberately unwired — see §10).

**Changed:** `app/(main)/goals/[id]/page.tsx` (rewritten around the four tabs),
`lib/tasks.ts` + `lib/api/goals.ts` (plan/schedule/status fields, `previewTasks` /
`createTasksFromDrafts` replacing `generateTasks`, `setStatus`, `setCompleted`,
`reschedule`, `moveToBacklog`), `lib/weekly-capacity.ts` (`isScheduled` now
aliases `hasTimeSlot` so "scheduled" has one definition),
`hooks/useGoalMutations.ts` (AI switch → `?aiPlan=1`), `lib/goal-form.ts` +
`components/goals/form/GoalFormContainer.tsx` (recurrence removed),
`components/goals/form/AdvancedStep.tsx` (honest copy), `lib/goals.ts`
(deprecation notes), `lib/api/ai-client.ts` (typo fix).

**Deleted:** `components/goals/GoalCoach.tsx` — its only behaviour was
generate-and-insert-immediately, fully replaced by `AiTaskPlanDialog`'s
draft-review-confirm flow. No user data involved.

## 12. Remaining work (Phase 3+)

- **Phase 3:** backlog drag-to-calendar, phase/key-result filters on the
  calendar itself, a "Find another slot" suggestion for missed tasks (the other
  three missed-task actions — keep overdue, move to tomorrow, return to backlog
  — ship in the task details sheet), optional swipe gestures on mobile task
  cards (visible menu actions already cover every operation, so swipe stays
  additive), and URL-persisted filter state so a filtered All Tasks view is
  shareable.
- **Phase 4:** evidence and review *authoring* UI (Progress currently reads
  both), outcome-progress history.
- **Phase 5:** the full AI Plan Builder (phases + tasks + routine + risks in
  one validated payload, with vague-task rejection) and the Smart Scheduler
  preview. `AiTaskPlanDialog` is the review-screen pattern they should reuse.
- **Ops:** apply both migrations to the shared Supabase project, and consider
  the cron generator described in §4. Until `20260724020000` runs, every task
  reads as its legacy-derived status (`resolveTaskStatus` handles a missing
  column), so the views degrade rather than break.
