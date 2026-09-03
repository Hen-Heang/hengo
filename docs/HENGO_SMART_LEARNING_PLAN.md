# Hengo smart Korean learning loop — plan

## Current flow

`/home` greets the learner, then shows a `VocabReviewCard` (due count +
mastered/total) as the visually primary element, followed by four
equal-weight shortcut tiles (Today's Practice, Daily Phrase, Speak & Coach,
Continue Study) and a one-line stats footer (due/mastered/streak). All four
shortcuts render at the same size — nothing tells the learner which one
actually matters today.

Meanwhile `/practice` already builds a real personalized checklist:
`missionsApi.getOrCreateToday()` calls `lib/learning/mission-engine.ts`'s
`buildDailyMission()`, a deterministic function that weighs due vocabulary,
due corrections, due phrase cards, the weakest measured skill
(`kori_skill_mastery`), an active exam or stated goal, and feature variety
into an ordered set of `DailyMissionItemPlan`s, persisted once per
(user, Korea-calendar day) to `kori_daily_missions` /
`kori_daily_mission_items`. `missionsApi.refreshProgress()` re-checks each
item against real evidence (graded SRS cards, a learned daily phrase,
completed scenario/listening/interview attempts) rather than trusting that a
page was opened. None of this reaches `/home` today — the Today page and the
mission engine are built by the same codebase but never talk to each other.

## Target flow

`/home` becomes the single place that answers "what should I practice
today?", using the mission that already exists:

1. One dominant **Today's Korean** card: estimated minutes
   (`mission.estimatedMinutes`), an itemized breakdown of what's in it (due
   vocab / due phrases / due corrections / listening / speaking, from
   `mission.items`), `completed/total` progress, the mission's own
   human-readable `reason` string, and a single primary CTA — **Start
   today's practice** → `/practice`.
2. A compact **Needs attention** row naming the weakest skill(s)
   (`mission.focusSkillCodes` → `skillLabel()`), shown only when real
   weak-skill data exists.
3. Streak, folded in as a small supporting line, not a stat box.
4. Three secondary shortcuts, visually subordinate to the mission card: Add a
   word (`/vocab`), Continue study (existing `lib/last-visited.ts` deep
   link), Speak with Coach (`/korean-coach`). "Today's Practice" and "Daily
   Phrase" stop being separate tiles — both are now folded into the mission
   card, since the mission already includes a `daily_phrase` item whenever
   it isn't learned yet.

`/practice` is untouched this session (Session 2 per the phased plan) — it
keeps its own local mission fetch. Both surfaces read the same
`kori_daily_missions` row for the same calendar day, so they can never
disagree.

## Data mapping

| UI element | Source |
| --- | --- |
| Estimated minutes | `mission.estimatedMinutes` |
| Item breakdown | `mission.items[].type` + `.targetCount`, formatted per type |
| Progress `n/total` | `mission.items.filter(i => i.status === "completed").length` / `mission.items.length` |
| Supporting explanation | `mission.reason` (already assembled from up to two real item reasons) |
| Needs attention | `mission.focusSkillCodes.map(skillLabel)`, capped at 2 |
| Streak | `useStreak()` (existing hook, `kori_activity_log`-backed) |
| Continue study href | `getLastVisited("learn", "/learn")` (existing) |

No new Supabase tables or columns. No database migration.

## UX gaps closed

- The learner previously had to pick among four equally-weighted tiles
  before doing anything; now there's one obvious next action.
- Vocabulary due count, weak skills, and the daily phrase were three
  separate, uncoordinated signals; the mission engine already unifies them
  into one prioritized plan — `/home` just needed to read it.
- "Needs attention" was nowhere on `/home` despite `kori_skill_mastery`
  already tracking it.

## Files likely to change (this session)

- `apps/web/hooks/useDailyMission.ts` — new. TanStack Query wrapper around
  `missionsApi.getOrCreateToday()` + `.refreshProgress()`, same shape as
  `useVocab`/`useStreak`/`useDailyPhrase`, so `/practice` can adopt it in a
  later session without another data-fetching rewrite.
- `apps/web/app/(main)/home/page.tsx` — replace `VocabReviewCard` +
  four-tile shortcut grid with the mission-first layout.
- `apps/web/components/home/TodayMissionCard.tsx` — new primary card.
- Existing `WorkspacePosterCard`, `useVocab`, `useDailyPhrase`, `useStreak`
  stay as-is; the daily-phrase tile is dropped from `/home` but the hook
  remains available for `/practice`.

## Implementation phases (unchanged from the master brief)

Session 1: `/home` only (done). Session 2: `/practice` becomes a focused
step-by-step session (done, see below). Session 3: Coach simplification.
Session 4: correction → future-practice wiring. Session 5: vocabulary
capture/review hierarchy. Session 6: skill-aware `/learn`. Each session waits
for approval before starting.

## Session 2 notes

**A second, parallel "daily practice" system already existed**:
`/practice/today` (`components/daily-study/DailyStudyPlanPage.tsx`) is a
fully-built session UI over `kori_daily_study_plans` — weekday-topic content
(`lib/daily-study-plan.ts`), busy/normal/office pacing, and a real
speak→correct→retry loop (`VoicePractice.tsx`). It predates the mission
engine, is generic (not personalized to due/weak data), and is hidden from
nav. This session deliberately did **not** merge the two systems — `/practice`
now builds its focused flow on the mission engine (personalized, tied to real
due/weak evidence and to `/home`'s card), and `/practice/today` is untouched.
Whether to retire, merge, or keep both as separate modes is a product
decision for a later session, not an engineering default.

**Reuse over rebuild**: rather than embedding new interactive UI for every
mission item type, `/practice`'s focused step hands off via one CTA to the
feature that already owns that interaction — `/vocab` already has a complete,
polished flashcard reviewer (`components/vocab/ReviewSession.tsx`); `/vocab`'s
Phrases tab already renders `DailyPhraseCard`; listening/scenario/interview/
corrections already have their own dedicated pages. Only `vocab_review` and
`daily_phrase` get an inline Korean-first *preview* (real due words / the
actual phrase) before the CTA — everything else shows the mission item's own
`title`/`reason` text, which is already real and specific.

## Session 3 notes

**The speak→correct→retry loop was already mostly built.** `CoachFeedback.tsx`
already renders structured sections (transcript → understood meaning →
corrected sentence → natural alternative → explanation → listen → retry →
continue → save mistake) in the required order, and the AI prompt
(`lib/korean-coach/tutor-prompt.ts`) already tells the model to flag only
errors that block meaning or sound inappropriate at beginner level, and to
suggest a retry only when an important correction exists — i.e. Phase 5's
"don't correct every tiny difference" was already prompt-level policy. The
only real defect: literal numbered prefixes ("1. What you said", "7. Try
Again", …) baked into user-facing copy, which read as leftover implementation
labels — removed; `coach-ui.test.tsx`'s ordering assertions use substring
matching so they still pass.

**Coach's landing page** got the same treatment as `/home`/`/practice`: one
dominant card (the deterministically-picked `recommendedScenario`, its
`learningObjectives` as "why this" tags, one "Start speaking" CTA straight
into `/korean-coach/practice/[id]`), three compact secondary links (Other
scenarios / Listening / Review mistakes), and a small streak line. The
4-stat `PageHero`, the separate "Recommended next"/"Repeated mistakes"/
"Recent sessions" cards, the voice-privacy disclosure, and "Delete history"
all moved: recent sessions to new `/korean-coach/history` (same 5-session
cap `getDashboard` already returned — no new query), the rest into a new
"Data & privacy" section on `/korean-coach/preferences`.
