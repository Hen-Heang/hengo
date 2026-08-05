-- kori_send_daily_study_reminder is dead code left behind by the Phase 4
-- "universal reminders" migration (20260726150000_universal_reminders.sql):
-- it duplicates what kori_dispatch_reminders + kori_send_streak_saver_reminders
-- / kori_send_reviews_due_reminders now cover, but unlike those it was never
-- wired into cron.job, is never called by any other function, and is never
-- referenced from application code (only a leftover generated type stub in
-- lib/database.types.ts, which `pnpm supabase gen types` will drop on its
-- own the next time it runs).
drop function if exists public.kori_send_daily_study_reminder();
