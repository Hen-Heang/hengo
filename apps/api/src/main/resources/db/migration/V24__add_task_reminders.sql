-- Scheduled task reminders (ported from the Orbit/goalmap Supabase
-- scheduled-reminders system: get_due_task_reminders + reminder columns).
--
-- A per-minute backend job (ReminderScheduler) finds timed, upcoming, not-yet-
-- reminded tasks whose start is within the user's reminder offset and pushes a
-- "⏰ Upcoming task" notification via the existing PushDispatcher (Telegram /
-- web push). reminder_sent_at is the fire-once dedupe guard.

-- 1) Per-user reminder preferences.
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_offset_minutes INTEGER NOT NULL DEFAULT 30;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone                TEXT    NOT NULL DEFAULT 'UTC';

-- 2) Fire-once stamp on tasks.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Partial index keeps the per-minute "due reminders" scan cheap by only
-- indexing tasks that are still reminder candidates.
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_due
    ON tasks (start_date)
    WHERE completed = false AND reminder_sent_at IS NULL;
