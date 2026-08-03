ALTER TABLE vocab_cards
    ADD COLUMN IF NOT EXISTS example_translation TEXT;
