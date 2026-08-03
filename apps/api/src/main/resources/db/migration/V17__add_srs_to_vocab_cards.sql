-- Real spaced-repetition (SM-2) state per card.
ALTER TABLE vocab_cards
    ADD COLUMN IF NOT EXISTS ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
    ADD COLUMN IF NOT EXISTS interval_days INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS repetitions INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS lapses INTEGER NOT NULL DEFAULT 0;

-- Seed existing decks from the old mastery score (one repetition per 20 mastery,
-- matching the old +20-per-correct-review scheme) so nobody's progress resets.
UPDATE vocab_cards
SET repetitions   = GREATEST(0, mastery / 20),
    interval_days = GREATEST(0, mastery / 20)
WHERE repetitions = 0
  AND mastery > 0;
