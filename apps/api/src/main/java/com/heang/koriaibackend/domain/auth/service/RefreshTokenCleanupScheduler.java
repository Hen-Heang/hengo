package com.heang.koriaibackend.domain.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Daily housekeeping for {@code refresh_tokens}: purges rows that are expired or already revoked. */
@Slf4j
@Component
@RequiredArgsConstructor
public class RefreshTokenCleanupScheduler {

    private final RefreshTokenService refreshTokenService;

    /** Runs once a day at 03:00 server time. */
    @Scheduled(cron = "0 0 3 * * *")
    public void purgeExpiredTokens() {
        try {
            int deleted = refreshTokenService.cleanupExpired();
            if (deleted > 0) {
                log.info("Purged {} expired/revoked refresh token(s)", deleted);
            }
        } catch (Exception e) {
            log.warn("Refresh token cleanup failed: {}", e.getMessage());
        }
    }
}
