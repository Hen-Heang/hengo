-- Learner profile fields used to personalize AI prompts (and already collected by
-- the Settings form, which was silently discarding them — only display_name and
-- korean_level were persisted). Feeding these into the tutor/analyzer prompts lets
-- the AI tailor examples to the learner's job, native language, and goal.

ALTER TABLE users ADD COLUMN IF NOT EXISTS country             TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS native_language     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation          TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_goal       TEXT;
