-- Allow the AI goal task-generation feature to be recorded in api_usage_logs.
ALTER TABLE api_usage_logs DROP CONSTRAINT IF EXISTS ck_api_usage_logs_feature;

ALTER TABLE api_usage_logs ADD CONSTRAINT ck_api_usage_logs_feature
    CHECK (feature IN (
        'CHAT',
        'CORRECTION',
        'DIARY_FEEDBACK',
        'VOCAB_EXPLANATION',
        'VOCAB_GENERATION',
        'GRAMMAR_EXPLANATION',
        'DAILY_PHRASE',
        'MESSAGE_GEN',
        'LISTENING',
        'ANALYZER',
        'GOAL_TASKGEN'
    ));
