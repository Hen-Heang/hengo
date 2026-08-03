package com.heang.koriaibackend.domain.goal.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

/** Daily housekeeping for {@code goal_notifications}: purges read notifications older than 90 days. */
@Slf4j
@Component
@RequiredArgsConstructor
public class GoalNotificationCleanupScheduler {

    private static final int RETENTION_DAYS = 90;

    private final GoalNotificationService goalNotificationService;

    /** Runs once a day at 03:15 server time. */
    @Scheduled(cron = "0 15 3 * * *")
    public void purgeReadNotifications() {
        try {
            int deleted = goalNotificationService.cleanupRead(OffsetDateTime.now().minusDays(RETENTION_DAYS));
            if (deleted > 0) {
                log.info("Purged {} read goal notification(s) older than {} days", deleted, RETENTION_DAYS);
            }
        } catch (Exception e) {
            log.warn("Goal notification cleanup failed: {}", e.getMessage());
        }
    }
}
