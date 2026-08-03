-- Remove the diary feature: it is not part of the workplace-Korean product scope.

-- Drop the diary-based achievement. The FK on user_achievements.achievement_code
-- cascades, so any users who unlocked it are cleaned up automatically.
DELETE FROM achievements WHERE code = 'DILIGENT_WRITER';

-- Drop the diary table (added in V1, extended in V6).
DROP TABLE IF EXISTS diary_entries;
