-- Due-soon + overdue task reminders.
--
-- Extends the "starting soon" reminder system (V24) with two more fire-once
-- notifications driven by the same per-minute ReminderScheduler:
--   * due_soon_sent_at  — task's daily_end_time is within the owner's reminder
--                         offset and hasn't passed yet ("⏳ Task due soon").
--   * overdue_sent_at    — task's daily_end_time has passed and it's still
--                         incomplete ("⚠️ Task overdue").
-- Each is an independent dedupe guard so a task can fire "due soon" and later
-- "overdue" exactly once each. Mirrors reminder_sent_at's contract.

-- 1) Two more fire-once stamps on tasks.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_soon_sent_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS overdue_sent_at  TIMESTAMPTZ;

-- 2) Backfill guard: any timed task already past its deadline at deploy time
-- must never retro-fire. Stamp both columns so only tasks that cross their end
-- time AFTER this migration produce a push. (Future-deadline tasks stay NULL
-- and fire naturally; "due soon" needs no backfill since past tasks can't match
-- its end_instant > now() condition, but stamping it here is harmless.)
UPDATE tasks t
SET overdue_sent_at = now(),
    due_soon_sent_at = now()
FROM users u
WHERE u.id = t.user_id
  AND t.completed = false
  AND COALESCE(t.is_anytime, false) = false
  AND t.daily_end_time IS NOT NULL
  AND (
        (date(t.end_date AT TIME ZONE COALESCE(u.timezone, 'UTC')) + t.daily_end_time)
            AT TIME ZONE COALESCE(u.timezone, 'UTC')
      ) <= now();

-- 3) Partial indexes keep the per-minute scans cheap by only indexing tasks
-- that are still candidates for each reminder kind.
CREATE INDEX IF NOT EXISTS idx_tasks_due_soon
    ON tasks (end_date)
    WHERE completed = false AND due_soon_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_overdue
    ON tasks (end_date)
    WHERE completed = false AND overdue_sent_at IS NULL;
