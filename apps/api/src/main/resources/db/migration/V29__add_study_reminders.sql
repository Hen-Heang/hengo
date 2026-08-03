-- Daily study reminders: the two highest-leverage learning nudges.
--
-- Driven by a per-minute StudyReminderScheduler, anchored to Asia/Seoul wall
-- clock (consistent with the dashboard's streak/due logic):
--   * Reviews due  — once/day at the user's study hour, only if SRS cards are
--                    due ("📚 N words ready to review").
--   * Streak saver — once/day in the evening, only if the user has an active
--                    streak but no activity yet today ("🔥 Keep your N-day streak").
-- Each is deduped per user per Seoul day via a *_pushed_on DATE stamp, so the
-- first qualifying minute fires and the rest of the day is skipped.

-- Per-user study-reminder preferences.
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE;
-- Local (Seoul) hour-of-day to send the reviews-due nudge. Default 20:00 — devs
-- in Korea mostly study after work.
ALTER TABLE users ADD COLUMN IF NOT EXISTS study_reminder_hour      INTEGER NOT NULL DEFAULT 20;

-- Per-day fire-once stamps (Seoul date).
ALTER TABLE users ADD COLUMN IF NOT EXISTS reviews_due_pushed_on  DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_saver_pushed_on DATE;
