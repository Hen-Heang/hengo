-- Backfill creator memberships for goals that have no membership row for their
-- owner. Natively-created goals get a 'creator' goal_members row (GoalService),
-- but goals migrated from the Orbit/Supabase data set were inserted without one,
-- so owner-only actions (share-code regenerate, invite, remove member) 403'd.
--
-- Idempotent: only inserts where the owner has no membership row yet.
INSERT INTO goal_members (goal_id, user_id, role)
SELECT g.id, g.user_id, 'creator'
FROM goals g
WHERE NOT EXISTS (
    SELECT 1 FROM goal_members m
    WHERE m.goal_id = g.id AND m.user_id = g.user_id
);
