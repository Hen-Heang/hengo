-- "Save sentence" (reading paragraphs feeding the vocab deck as a "Saved
-- Sentences" category) can put a full sentence in `term`, which the original
-- VARCHAR(200) (sized for single words/short phrases) could reject or
-- truncate. TEXT matches `meaning`/`example`, which already had no limit.
ALTER TABLE vocab_cards ALTER COLUMN term TYPE TEXT;
