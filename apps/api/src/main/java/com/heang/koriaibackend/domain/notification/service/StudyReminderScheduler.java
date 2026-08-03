package com.heang.koriaibackend.domain.notification.service;

import com.heang.koriaibackend.domain.dashboard.mapper.DashboardMapper;
import com.heang.koriaibackend.domain.notification.mapper.StudyReminderMapper;
import com.heang.koriaibackend.domain.notification.model.StudyReminderRecipient;
import com.heang.koriaibackend.domain.push.service.PushDispatcher;
import com.heang.koriaibackend.domain.push.service.PushMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Per-minute daily study reminders — the two highest-leverage learning nudges,
 * sibling to the task-focused {@code ReminderScheduler}. Both fan out through the
 * existing {@link PushDispatcher} (Telegram / web push / FCM) and dedupe once per
 * Seoul day via a {@code *_pushed_on} stamp on the user, so a missed minute
 * self-heals on the next tick rather than double-sending.
 *
 * <ul>
 *   <li><b>Reviews due</b> — at the user's study hour, only when SRS cards are due
 *       (vocab and/or mistake-review corrections combined,
 *       {@link StudyReminderMapper#findReviewsDueRecipients()}). Reviewing near
 *       the due moment is the single biggest retention lever.</li>
 *   <li><b>Streak saver</b> — in the evening, only when a live streak has no
 *       activity yet today ({@link StudyReminderMapper#findStreakSaverRecipients()}).
 *       Loss-aversion is the most effective habit trigger there is.</li>
 *   <li><b>Exam countdown</b> — at the user's study hour, every day until the
 *       K-Specialist speaking exam ({@link StudyReminderMapper#findExamCountdownRecipients()}).
 *       Unconditional — the reminder itself is the point.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StudyReminderScheduler {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    /** K-Specialist speaking exam date — mirrors EXAM_DATE in the frontend's lib/study-plan.ts. */
    private static final LocalDate EXAM_DATE = LocalDate.of(2026, 8, 29);

    private final StudyReminderMapper studyReminderMapper;
    private final DashboardMapper dashboardMapper;
    private final PushDispatcher pushDispatcher;

    /** Runs at the top of every minute (server time); SQL gates are Seoul-anchored. */
    @Scheduled(cron = "0 * * * * *")
    public void sendStudyReminders() {
        sendReviewsDue();
        sendStreakSavers();
        sendExamCountdown();
    }

    private void sendReviewsDue() {
        List<StudyReminderRecipient> recipients;
        try {
            recipients = studyReminderMapper.findReviewsDueRecipients();
        } catch (Exception e) {
            log.warn("Reviews-due scan failed: {}", e.getMessage());
            return;
        }
        if (recipients.isEmpty()) {
            return;
        }
        for (StudyReminderRecipient r : recipients) {
            try {
                int n = r.getDueCount();
                String body = n == 1
                        ? "1 review is ready — keep it fresh."
                        : n + " reviews are ready — a quick session keeps them fresh.";
                pushDispatcher.dispatch(
                        r.getUserId(),
                        new PushMessage("📚 Time to review", body, "/practice"));
                studyReminderMapper.markReviewsDuePushed(r.getUserId());
            } catch (Exception e) {
                log.warn("Failed reviews-due reminder for user {}: {}", r.getUserId(), e.getMessage());
            }
        }
        log.info("Sent {} reviews-due reminder(s)", recipients.size());
    }

    private void sendStreakSavers() {
        List<StudyReminderRecipient> recipients;
        try {
            recipients = studyReminderMapper.findStreakSaverRecipients();
        } catch (Exception e) {
            log.warn("Streak-saver scan failed: {}", e.getMessage());
            return;
        }
        if (recipients.isEmpty()) {
            return;
        }
        for (StudyReminderRecipient r : recipients) {
            try {
                int streak = dashboardMapper.countStreakDays(r.getUserId());
                // Defensive: the SQL already requires activity yesterday, so the
                // forgiving streak is > 0 here — but never nag with "0-day streak".
                if (streak <= 0) {
                    studyReminderMapper.markStreakSaverPushed(r.getUserId());
                    continue;
                }
                String body = "You haven't studied today — a few minutes keeps your "
                        + streak + "-day streak alive.";
                pushDispatcher.dispatch(
                        r.getUserId(),
                        new PushMessage("🔥 Keep your streak", body, "/dashboard"));
                studyReminderMapper.markStreakSaverPushed(r.getUserId());
            } catch (Exception e) {
                log.warn("Failed streak-saver reminder for user {}: {}", r.getUserId(), e.getMessage());
            }
        }
        log.info("Sent {} streak-saver reminder(s)", recipients.size());
    }

    private void sendExamCountdown() {
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(SEOUL), EXAM_DATE);
        // Stop nagging once the exam has passed — there's nothing left to count down to.
        if (daysRemaining < 0) {
            return;
        }
        List<StudyReminderRecipient> recipients;
        try {
            recipients = studyReminderMapper.findExamCountdownRecipients();
        } catch (Exception e) {
            log.warn("Exam-countdown scan failed: {}", e.getMessage());
            return;
        }
        if (recipients.isEmpty()) {
            return;
        }
        String body = daysRemaining == 0
                ? "Exam day — 화이팅! Good luck today."
                : daysRemaining == 1
                        ? "Tomorrow is your K-Specialist exam — last day to prepare. Don't be lazy today."
                        : "D-" + daysRemaining + " until your K-Specialist exam — don't be lazy, get a session in today.";
        for (StudyReminderRecipient r : recipients) {
            try {
                pushDispatcher.dispatch(
                        r.getUserId(),
                        new PushMessage("🎯 K-Specialist exam countdown", body, "/interview"));
                studyReminderMapper.markExamCountdownPushed(r.getUserId());
            } catch (Exception e) {
                log.warn("Failed exam-countdown reminder for user {}: {}", r.getUserId(), e.getMessage());
            }
        }
        log.info("Sent {} exam-countdown reminder(s) (D-{})", recipients.size(), daysRemaining);
    }
}
