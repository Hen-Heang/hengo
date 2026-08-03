-- ============================================================================
-- Goal tracking (ported from the dailygoalmap/orbit Supabase app).
--
-- Differences from the original Supabase schema:
--   * Row-Level Security is dropped; authorization now lives in the Spring
--     service layer (owner / member / public checks).
--   * user references are BIGINT FKs to the existing `users` table instead of
--     Supabase auth.users UUIDs.
--   * Goal/task PKs stay UUID so the existing live rows migrate without
--     remapping every relationship.
-- Scope: core goal/task only. AI memory, RAG, push and edge functions deferred.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- 1) goal_themes ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goal_themes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               BIGINT NOT NULL,
    name                  TEXT NOT NULL,
    goal_profile_image    TEXT,
    card_background_image TEXT,
    page_background_image TEXT,
    is_public             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_goal_themes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_goal_themes_user ON goal_themes (user_id);

-- 2) goals ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    target_date TIMESTAMPTZ,
    status      TEXT NOT NULL DEFAULT 'active',
    metadata    JSONB,
    share_code  UUID NOT NULL DEFAULT gen_random_uuid(),
    is_public   BOOLEAN NOT NULL DEFAULT FALSE,
    public_slug TEXT,
    ai_prompt   TEXT,
    theme_id    UUID,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_goals_user  FOREIGN KEY (user_id)  REFERENCES users (id)        ON DELETE CASCADE,
    CONSTRAINT fk_goals_theme FOREIGN KEY (theme_id) REFERENCES goal_themes (id)  ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_goals_user_id     ON goals (user_id);
CREATE INDEX IF NOT EXISTS idx_goals_share_code  ON goals (share_code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_goals_public_slug ON goals (public_slug) WHERE public_slug IS NOT NULL;

-- 3) goal_members -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS goal_members (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id   UUID NOT NULL,
    user_id   BIGINT NOT NULL,
    role      TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ,
    CONSTRAINT fk_goal_members_goal FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE,
    CONSTRAINT fk_goal_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_goal_members_goal_user UNIQUE (goal_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_goal_members_goal_id ON goal_members (goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_members_user_id ON goal_members (user_id);

-- 4) tasks ------------------------------------------------------------------
-- goal_id is nullable: a NULL goal_id is a standalone personal/daily task.
CREATE TABLE IF NOT EXISTS tasks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id          UUID,
    user_id          BIGINT NOT NULL,
    title            TEXT NOT NULL,
    description      TEXT,
    completed        BOOLEAN NOT NULL DEFAULT FALSE,
    start_date       TIMESTAMPTZ,
    end_date         TIMESTAMPTZ,
    daily_start_time TIME,
    daily_end_time   TIME,
    tags             TEXT[] NOT NULL DEFAULT '{}',
    updated_by       BIGINT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_tasks_goal       FOREIGN KEY (goal_id)    REFERENCES goals (id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_user       FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_tasks_date_range CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id          ON tasks (goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id          ON tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tags             ON tasks USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_tasks_user_standalone  ON tasks (user_id, start_date) WHERE goal_id IS NULL;

-- 5) goal_stars (per-user pinned goals) -------------------------------------
CREATE TABLE IF NOT EXISTS goal_stars (
    user_id    BIGINT NOT NULL,
    goal_id    UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, goal_id),
    CONSTRAINT fk_goal_stars_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_goal_stars_goal FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_goal_stars_user_id ON goal_stars (user_id);

-- 6) notifications ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS goal_notifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type              TEXT NOT NULL,
    goal_id           UUID,
    sender_id         BIGINT NOT NULL,
    receiver_id       BIGINT NOT NULL,
    payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
    invitation_status TEXT,
    read_at           TIMESTAMPTZ,
    date              TIMESTAMPTZ,
    url               TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_goal_notifications_goal     FOREIGN KEY (goal_id)     REFERENCES goals (id) ON DELETE SET NULL,
    CONSTRAINT fk_goal_notifications_sender   FOREIGN KEY (sender_id)   REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_goal_notifications_receiver FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_goal_notifications_invite_status
        CHECK (invitation_status IS NULL OR invitation_status IN ('pending', 'accepted', 'declined'))
);
CREATE INDEX IF NOT EXISTS idx_goal_notifications_receiver ON goal_notifications (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goal_notifications_goal     ON goal_notifications (goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_notifications_unread   ON goal_notifications (receiver_id) WHERE read_at IS NULL;
