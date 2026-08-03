ALTER TABLE vocab_cards
    ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_vocab_cards_last_reviewed
    ON vocab_cards (user_id, last_reviewed_at);
