ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_image_content_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS profile_image_data BYTEA;
