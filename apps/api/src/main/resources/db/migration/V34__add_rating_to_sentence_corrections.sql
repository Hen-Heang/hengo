ALTER TABLE sentence_corrections
    ADD COLUMN IF NOT EXISTS rating SMALLINT;
