# Goal System v2 — Phase 0 Audit

Audit of the existing goal/task/learning-metrics system before the outcome-based
redesign. Everything below was verified against the actual code and the live
"hengo" Supabase project (`dnzqgnejwyucenghugrb`), not assumed.

## 1. Current architecture

**`goals`/`tasks`/`goal_members`/`goal_stars`/`notifications` are Orbit's
original tables**, reused by KoriAI/Hengo in the same Supabase project
(`lib/supabase.ts`, `lib/api/goals.ts:1-4`). There is no local migration file
for them — `supabase/migrations/` only covers KoriAI's own `kori_*` domain
(recovery, skills, corrections, missions, ai usage, interview practice, voice
sessions). The live schema (queried directly via `information_schema` and
`pg_policies`, since no migration file documents it) is:

```
goals: id, user_id, title, description, target_date, status ('active'
  default), metadata (jsonb), share_code (uuid), is_public (bool), public_slug,
  ai_prompt, theme_id, preferences (jsonb), created_at, updated_at, no_duration
tasks: id, goal_id, user_id, title, description, completed, start_date,
  end_date, daily_start_time, daily_end_time, tags, updated_by, created_at,
  updated_at, is_anytime, duration_minutes, color, reminder_sent_at,
  overdue_notified_at
goal_members: id, goal_id, user_id, role, joined_at, last_seen
goal_stars: user_id, goal_id, created_at
notifications: id, type, goal_id, sender_id, receiver_id, payload (jsonb),
  invitation_status, read_at, date, url, created_at
```

RLS is enabled on every table. `goals` is readable by owner, member, or when
`is_public`; write access (`insert`/`update`/`delete`) is owner-only
(`auth.uid() = user_id`). `tasks` follows the same owner-or-member pattern
through a `goals`/`goal_members` subquery. There are no `SECURITY DEFINER`
functions inspected beyond what `lib/api/goals.ts` already documents
(`join_goal`, `get_goal_by_share_code`, `regenerate_goal_share_code`,
`get_goal_members`, `remove_goal_member`, `get_enriched_notifications`).

**Client-side type layer**: `lib/goals.ts` (`Goal`, `GoalMetadata`,
`GoalDeadlineInfo`), `lib/tasks.ts` (`Task`). `Goal.metadata` is a schemaless
`jsonb` escape hatch (`[key: string]: unknown`) already carrying milestones,
travel details, financial details, a single opt-in `learning_metric`, and a
template id — every "extra" concept beyond the base columns before this audit
lived in that one JSON blob, not as real columns.

**API layer**: `lib/api/goals.ts` — `goalsApi`, `tasksApi`, `notificationsApi`,
all direct Supabase calls (no backend REST layer for this domain). Progress
enrichment happens in one place: `GOAL_SELECT = "*, goal_stars(user_id),
tasks(id, completed)"` + `enrichGoal()`, which computes `taskCounts` for every
goal in a list via a nested join.

**AI**: two goal-scoped AI routes exist today —
`app/api/ai/goals/generate-tasks/route.ts` (bulk task generator, `{ tasks: [...
title, description, start_date, end_date, duration_minutes] }` — no key
results, no evidence, no quality gate beyond prompt wording) and
`app/api/ai/goals/coach/route.ts` (ephemeral SSE chat, nothing persisted).
Both only see `title/description/status/target_date/tasks` — neither has any
concept of outcome, key result, or evidence.

**UI**: `components/goals/GoalList.tsx` (grid + list, no separate `GoalCard`
file), `app/(main)/goals/[id]/page.tsx` (hero + overview/tasks/members/
coach/settings tabs), `components/goals/LearningMetricCard.tsx` (opt-in single
auto-tracked metric), `components/goals/GoalMilestones.tsx` (checklist stored
in `metadata.milestones`), `components/goals/SmartAnalytics.tsx` +
`lib/analytics.ts` (productivity score / velocity / estimated completion —
richest existing progress math, but presentation-only, never fed back into
the stored goal). Goal creation has two independent flows: a Zod-validated
custom wizard (`lib/goal-form.ts`, `components/goals/form/*`) and a
template-picker + per-template dynamic form (`lib/goal-templates/*`,
`app/(main)/goals/create/**`) with its own hand-rolled validation.

## 2. Confirmed problems

All of the following were verified in the code, not assumed:

1. **Goal progress is completed/total tasks, computed independently in (at
   least) four places**: `lib/api/goals.ts:47-48` (`taskCounts`),
   `components/goals/GoalList.tsx:325` (`total > 0 ? Math.round((done/total)*100)
   : 0`), `app/(main)/goals/[id]/page.tsx:192` (identical formula, its own
   copy), `components/dashboard/GoalsOverview.tsx:22-25` (identical formula,
   a third copy). None of these called a shared helper before this change.
2. **A goal can show 100% with nothing real achieved**: 100% task completion
   directly gates the "Mark complete" prompt (`GoalList.tsx:326`,
   `readyToComplete`) with no outcome check at all.
3. **At least five independently-computed, never-reconciled "progress"
   numbers already existed per goal** before this change: task-count %,
   `calculateGoalDeadlineInfo`'s **time-elapsed** % (`lib/goals.ts:193`, a
   completely different axis that happens to also be called "progress"),
   `lib/analytics.ts`'s SmartAnalytics productivity/completion score
   (presentation-only), `LearningMetricCard`'s single-metric %, and
   `GoalMilestones`' checklist %. A goal detail page could (and does) show
   25% in the Timeline card and 90% in the hero bar simultaneously.
4. **Learning metrics are activity counts**: `LearningMetric` (`lib/goals.ts`)
   only supports `vocab_cards | corrections | foundation_lessons |
   activity_sessions` row counts via `progressApi.getMetricCount()`
   (`lib/api/progress.ts`) — no qualitative evidence, no baseline, single
   metric per goal, opt-in and easy to never discover.
5. **Vague goal titles/tasks are unconstrained**: neither `goalSchema`
   (`lib/goal-form.ts`) nor the AI task-generation Zod schema
   (`app/api/ai/goals/generate-tasks/route.ts`) reject vague titles — the
   prompt asks for "concrete, actionable tasks" but nothing validates the
   output against that.
6. **The AI Goal Coach is a bulk task generator + ephemeral chat**, nothing
   more — confirmed by reading both route handlers in full (§1 above).
7. **No structured baseline/target/success-evidence/key-result/capacity/
   review-cycle concept existed anywhere** — confirmed by grepping the whole
   repo for "key result", "evidence", "health status", "outcome" (all hits
   were unrelated: SRS mastery-engine outcomes, Recovery domain outcomes,
   generic prose). This is a genuinely greenfield addition.
8. **Task completion visually dominates**: `GoalList.tsx`'s color-graded
   progress bar (`progressGradient`) and the pulsing "Mark complete" pill are
   the primary visual signal; deadline status is a secondary badge; nothing
   about demonstrated improvement is shown anywhere.
9. **AI task generation has no volume ceiling beyond a UI button (5/7/10)** —
   `GoalCoach.tsx` — a user can repeatedly generate more batches with no
   guardrail against busy-work accumulation.
10. **Identity/ownership**: confirmed via direct SQL against the live
    project — see §3 below and `docs/account-reconciliation-plan.md`.

## 3. Account identity finding (live data, verified 2026-07-23)

Queried `goals`, `tasks`, `kori_vocab_cards`, `kori_activity_log`, and
`goal_members` directly. **All goal/task/learning rows in the live project
belong to a single user id** (`ac5db382-...`), which also has a `kori_profiles`
row. However, `goal_members` has a **second** auth identity
(`8586e909-...`) with 2 membership rows — this identity has an `auth.users`
row but **no `kori_profiles` row at all**: someone who was invited to/joined a
shared goal (from the era this was Orbit's product) but never used any KoriAI
Korean-learning feature. This is the concrete version of "goals and
Korean-learning data may belong to different identities" — not a data
conflict on the primary user's own rows, but a second, unrelated identity
attached to the goals domain only. **No ownership was modified.** Full
handling plan in `docs/account-reconciliation-plan.md`.

## 4. Files changed / to change (this pass vs. deferred)

**Changed in Phase 1 (this pass)**: `lib/goals.ts` (outcome fields +
health-status styling), `lib/tasks.ts` (task quality fields), new
`lib/goal-key-results.ts` / `lib/goal-evidence.ts` / `lib/goal-reviews.ts`
(types), new `lib/goal-progress.ts` / `lib/goal-health.ts` (pure engines +
tests), `lib/api/goals.ts` (outcome fields + key-result nested select), new
`lib/api/goal-key-results.ts` / `lib/api/goal-evidence.ts` /
`lib/api/goal-reviews.ts`, `lib/api/index.ts` (barrel), new
`supabase/migrations/20260723020000_goal_outcomes_v2.sql`, minimal UI:
`components/goals/KeyResultsCard.tsx`, `components/goals/HealthBadge.tsx`,
`app/(main)/goals/[id]/page.tsx`, `components/goals/GoalList.tsx`.

**Deferred to Phase 2+ (not touched this pass)**: the goal-creation wizard
redesign (4-step Outcome/Measurement/Capacity/AI-draft flow), travel-specific
logic removal from `lib/goal-form.ts`/`TravelDetailsStep.tsx`/
`EditGoalSlidePanel.tsx`, `GoalMilestones` vs. key-results reconciliation
(they remain two separate concepts for now — milestones are a lightweight
checklist, key results are measured), Evidence tab UI, Weekly Review UI, the
AI Goal Architect route, the AI Weekly Coach route, the Today experience
redesign, and the Money Flow integration card (architecture documented in
`docs/money-flow-integration.md`, not implemented).

## 5. Migration plan (implemented this pass)

`supabase/migrations/20260723020000_goal_outcomes_v2.sql` — applied directly
to the live "hengo" project via the Supabase MCP tool (explicit user
confirmation obtained before applying, since it's a shared, production
project with real user data). Fully additive:

- `goals`: 10 new nullable/defaulted columns (`outcome_statement`,
  `motivation`, `baseline_summary`, `success_definition`,
  `weekly_capacity_minutes`, `review_frequency`, `outcome_progress` default 0,
  `health_status` default `'not_started'`, `health_reason`,
  `last_reviewed_at`). No existing column touched.
- Three new tables: `goal_key_results`, `goal_evidence`, `goal_reviews` — all
  with RLS scoped to `user_id = auth.uid()`, matching the spec's "users can
  access only key results belonging to their own goals."
- `tasks`: 8 new nullable/defaulted columns (`key_result_id`,
  `expected_output`, `completion_criteria`, `evidence_required` default
  false, `impact_level`, `effort_minutes`, `source` default `'manual'`,
  `reschedule_count` default 0).

**Compatibility**: every existing `select *`/named-column query (from this
app or Orbit) keeps working unchanged — nothing was renamed, dropped, or
narrowed, and every new column is nullable or has a safe default. Verified
post-apply by re-querying `information_schema.columns` for the three new
tables and confirming they landed with the expected shape.

## 6. Architecture decisions

- **Outcome progress is computed fresh on read, not trusted from the
  persisted `outcome_progress`/`health_status` columns.** The columns exist
  (per spec) as a durable snapshot — primarily populated by a Weekly Review's
  `outcome_progress_before/after` — but the goal list/detail UI always
  recomputes via `lib/goal-progress.ts`/`lib/goal-health.ts` from the live
  `keyResults` + task data. This avoids a write-amplification bug class
  (stale snapshot vs. live key-result edits) at the cost of the columns not
  being independently authoritative yet. A future background recompute-and-
  persist job (e.g., on every key-result mutation) is a reasonable Phase 2
  addition if an external reader ever needs the column instead of computing
  client-side.
- **`GoalKeyResult.status === "archived"` is excluded from both the
  numerator and the weight** in the weighted-average calculation — archiving
  a key result removes it from outcome math entirely rather than zeroing it
  out (which would unfairly punish the goal for a KR the user decided no
  longer applies).
- **A missing `target_value` yields 0% progress, not an error or exclusion**
  — a key result without a defined target is treated as "no defined success
  point yet," consistent with the "reject vague/undefined goals" spirit of
  the wider redesign.
- **`allKeyResultsAchieved` is informational only** — it is used to decide
  whether to *offer* a "mark complete" action, never to auto-complete a goal.
  Explicit user confirmation (existing `goalsApi.update(id, { status:
  "completed" })` flow) is still the only way a goal becomes `completed`.
- **List-view health omits the two task-detail-dependent risk signals**
  (overdue high-impact tasks, days-since-last-activity) because the goal
  list only has aggregate `taskCounts`, not each goal's full task list —
  fetching that per-goal would be an N+1 query. The goal detail page, which
  already loads the full task list, computes both signals. This is a
  deliberate, documented tradeoff, not an oversight.
- **Key results and milestones stay separate concepts.** Milestones
  (`GoalMetadata.milestones`) remain a lightweight, un-measured checklist;
  key results are the new measured layer. Reconciling/merging them is
  explicitly deferred — forcing a merge now risked breaking the existing
  milestone UI for no Phase-1 benefit.

## 7. Compatibility risks

- Every pre-v2 goal has `outcome_progress = 0`, `health_status =
  'not_started'`, and zero key results — `computeGoalProgress` correctly
  falls back to legacy activity progress for these (tested), and
  `computeGoalHealth` correctly returns `not_started`/`attention` rather than
  misreporting `on_track` (tested).
- The `goals`/`tasks` tables are shared with Orbit/DailyGoalMap outside this
  repo — the new columns are additive and nullable, but if Orbit's own code
  ever does a strict schema validation (e.g., an ORM with `select *` and a
  fixed row shape) it could see unexpected new fields. This risk was flagged
  to the user before applying the migration; no way to verify Orbit's code
  from inside this repo.
- `Task` type in `lib/tasks.ts` gained 8 new optional fields — anywhere the
  app spreads a full `Task` object into a Supabase `.insert()`/`.update()`
  call unconditionally (rather than picking specific fields) could
  unintentionally write `undefined` for these — audited `lib/api/goals.ts`'s
  `tasksApi.create`/`update` and confirmed they spread the payload object
  directly (`{ ...data }`), so omitted fields are simply absent from the
  request, not written as `null`. No unsafe call site found.

## 8. Phased implementation plan (status)

- **Phase 0 (this doc)** — done.
- **Phase 1 (Foundation)** — done this pass: migration, TS models, API layer,
  progress engine (18 tests), health engine (14 tests), legacy compatibility.
- **Phase 2 (Goal UI)** — partially done this pass (minimum required): Key
  Results card, health badge, separated outcome/activity progress on both
  goal list and goal detail. Not done: full wizard redesign, Evidence tab,
  Weekly Review tab, Insights tab, Action-Plan-grouped-by-key-result view.
- **Phase 3 (AI quality)** — not started: AI Goal Architect route, AI output
  quality validation, review-before-save workflow.
- **Phase 4 (Today)** — not started.
- **Phase 5 (Integration prep)** — docs only this pass (`docs/money-flow-
  integration.md`), no code.
