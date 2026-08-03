ALTER TABLE vocab_cards
    ADD COLUMN IF NOT EXISTS pronunciation    VARCHAR(300),
    ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20);
