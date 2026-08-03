-- All-time best correct-streak in vocab quiz/recall mode, so it syncs across
-- devices instead of living only in the browser's localStorage
-- (lib/vocab-review.ts BEST_STREAK_KEY on the frontend).
ALTER TABLE users ADD COLUMN IF NOT EXISTS vocab_best_streak INTEGER NOT NULL DEFAULT 0;
