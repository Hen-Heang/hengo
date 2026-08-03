ALTER TABLE diary_entries
    ADD COLUMN IF NOT EXISTS grammar_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS changes        JSONB NOT NULL DEFAULT '[]'::jsonb;