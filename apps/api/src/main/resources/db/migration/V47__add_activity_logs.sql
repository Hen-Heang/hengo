-- Stores real time-on-page measurements sent from the frontend (useSessionTimer).
-- Each row = a one-page visit, logged when the user navigates away.
CREATE TABLE activity_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature     VARCHAR(50)  NOT NULL,   -- 'vocab', 'chat', 'interview', 'reading', 'listening', 'foundations'
    duration_ms BIGINT       NOT NULL CHECK (duration_ms > 0 AND duration_ms <= 28800000), -- 1 ms – 8 h
    logged_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_date ON activity_logs(user_id, logged_at DESC);
