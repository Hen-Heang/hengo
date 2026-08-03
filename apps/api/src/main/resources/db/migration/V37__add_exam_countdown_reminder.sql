-- Third daily study-reminder nudge, sibling to reviews-due/streak-saver
-- (V29__add_study_reminders.sql): a daily Telegram/push reminder of how many
-- days remain until the K-Specialist speaking exam (2026-08-29), sent at the
-- user's study hour and deduped per Seoul day. Stops firing once the exam
-- date has passed (handled in StudyReminderScheduler, not SQL).
ALTER TABLE users ADD COLUMN IF NOT EXISTS exam_countdown_pushed_on DATE;
