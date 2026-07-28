-- Romanization has a single source of truth:
-- kori_korean_coach_preferences.romanization_mode ('always'|'on-request'|'never'),
-- edited at /korean-coach/preferences and read app-wide through
-- hooks/useRomanizationPreference.ts (Korean Coach, Phrasebook, daily study plan).
--
-- kori_profiles.romanization_preference was added by the Phrasebook work before
-- the Korean Coach preferences table was visible in that branch, and duplicated
-- the same concept with different value spelling ('on_request' vs 'on-request').
-- Nothing reads or writes it anymore.
--
-- The column is left in place rather than dropped: it is harmless, has a default,
-- and dropping it is the kind of destructive change that should be a deliberate
-- separate step once we're sure no unmerged branch still references it. The
-- comment marks it so it isn't mistaken for live configuration in the meantime.

comment on column public.kori_profiles.romanization_preference is
  'DEPRECATED (2026-07-28) — not read by any code. Use kori_korean_coach_preferences.romanization_mode instead. Safe to drop once no branch references it.';
