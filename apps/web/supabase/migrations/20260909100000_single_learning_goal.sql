-- One goal setting, not two.
--
-- /settings carried a "Learning goal" select writing kori_profiles
-- .learning_goal (free text: "Team meeting communication", …) while
-- /korean-coach/preferences carried "Main goal" writing
-- kori_korean_coach_preferences.main_goal (enum: workplace | daily-life |
-- presentation | general). Both claimed to shape what the AI practices; only
-- learning_goal actually reached a prompt. The /settings control is gone and
-- main_goal is now the single source every prompt and recommendation reads,
-- so learning_goal has to be carried across or those learners get silently
-- reset to the 'workplace' column default.
--
-- Every option the old /settings list offered was a workplace situation
-- (standups, team meetings, professional messages, technical discussion,
-- general workplace communication), so they all map to 'workplace'. The map
-- is written out in full anyway rather than collapsed to a single assignment:
-- it documents what the old values were, and it makes the one case that is
-- NOT workplace-shaped — a value we never offered but that free text could
-- hold — fall through to a no-op instead of being forced.
--
-- Idempotent, and deliberately conservative: it only ever inserts a row for
-- someone who has none. A learner who already opened Korean Coach preferences
-- has made a real choice there, and that choice wins over the old duplicate.

insert into public.kori_korean_coach_preferences (user_id, main_goal)
select
  p.id,
  case p.learning_goal
    when 'Daily standup participation' then 'workplace'
    when 'Team meeting communication' then 'workplace'
    when 'Writing professional messages' then 'workplace'
    when 'Technical discussion in Korean' then 'workplace'
    when 'General workplace communication' then 'workplace'
    else 'workplace'
  end
from public.kori_profiles p
where p.learning_goal is not null
  and p.learning_goal <> ''
on conflict (user_id) do nothing;

-- kori_profiles.learning_goal is intentionally left in place and still
-- written by registration and the onboarding wizard: app/(main)/layout.tsx
-- uses "learning_goal is set" as the cross-device "onboarding already done"
-- sentinel (the local flag is per-browser). Dropping the column would make
-- the wizard reappear for every existing learner on every new device.
