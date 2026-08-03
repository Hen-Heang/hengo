-- ============================================================================
-- Push notification channels (Phase 0 foundation).
--
-- The goal feature only wrote in-app rows to goal_notifications. These tables
-- back the external delivery channels that PushDispatcher fans out to:
--   * user_telegram_links     -> Telegram bot (Phase 1, implemented now)
--   * user_push_subscriptions -> Web Push / browser (Phase 2)
--   * user_devices            -> FCM / phone     (Phase 3)
-- Tables for Phases 2-3 are created up front so the schema is stable; their
-- send logic lands with the corresponding PushChannel implementation.
-- ============================================================================

-- 1) Telegram links ---------------------------------------------------------
-- One row per user. link_code is a short-lived token handed to the user as a
-- t.me deep link; the bot webhook exchanges it for the chat_id (the address we
-- send to). chat_id NULL = requested but not yet confirmed in Telegram.
CREATE TABLE IF NOT EXISTS user_telegram_links (
    user_id    BIGINT PRIMARY KEY,
    chat_id    BIGINT,
    link_code  TEXT,
    linked_at  TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_telegram_links_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_telegram_links_link_code
    ON user_telegram_links (link_code) WHERE link_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_telegram_links_chat ON user_telegram_links (chat_id);

-- 2) Web Push subscriptions (Phase 2) ---------------------------------------
-- A user may subscribe from multiple browsers/devices, so endpoint is unique
-- rather than user_id. p256dh + auth are the W3C Push encryption keys.
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    BIGINT NOT NULL,
    endpoint   TEXT NOT NULL,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_user_push_subscriptions_endpoint UNIQUE (endpoint)
);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user ON user_push_subscriptions (user_id);

-- 3) Mobile devices for FCM (Phase 3) ---------------------------------------
CREATE TABLE IF NOT EXISTS user_devices (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    BIGINT NOT NULL,
    fcm_token  TEXT NOT NULL,
    platform   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_devices_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_user_devices_token UNIQUE (fcm_token)
);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices (user_id);
