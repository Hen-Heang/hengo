-- Align the tasks table with the frontend (Orbit) task contract:
-- color, anytime mode, and a cached duration. See INTEGRATION.md / lib/tasks.ts.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_anytime       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color            TEXT;
