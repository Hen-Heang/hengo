package com.heang.koriaibackend.domain.goal.service;

import com.heang.koriaibackend.domain.goal.mapper.TaskMapper;
import com.heang.koriaibackend.domain.goal.model.DueTaskReminder;
import com.heang.koriaibackend.domain.push.service.PushDispatcher;
import com.heang.koriaibackend.domain.push.service.PushMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Supplier;

/**
 * Per-minute scheduled task reminders — the backend port of Orbit/goalmap's
 * {@code scheduled-reminders} edge function + pg_cron.
 * <p>
 * Each run fans three kinds of a task reminder out through the existing
 * {@link PushDispatcher} (Telegram / web push / FCM), each with its own DB-level
 * fire-once dedupe so a missed minute self-heals on the next tick:
 * <ul>
 *   <li><b>Starting soon</b> — start is within the owner's reminder offset
 *       ({@link TaskMapper#findDueReminders()}, stamped {@code reminder_sent_at}).</li>
 *   <li><b>Due soon</b> — the end (daily_end_time) is within the offset and not yet
 *       passed ({@link TaskMapper#findDueSoonReminders()}, {@code due_soon_sent_at}).</li>
 *   <li><b>Overdue</b> — the end has passed, and the task is still incomplete
 *       ({@link TaskMapper#findOverdueReminders()}, {@code overdue_sent_at}).</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final TaskMapper taskMapper;
    private final PushDispatcher pushDispatcher;

    /**
     * Runs at the top of every minute (server time).
     */
    @Scheduled(cron = "0 * * * * *")
    public void sendDueReminders() {
        scan("starting-soon", taskMapper::findDueReminders, taskMapper::markReminderSent,
                "⏰ Upcoming task", "\" is starting soon.");
        scan("due-soon", taskMapper::findDueSoonReminders, taskMapper::markDueSoonSent,
                "⏳ Task due soon", "\" is almost due.");
        scan("overdue", taskMapper::findOverdueReminders, taskMapper::markOverdueSent,
                "⚠️ Task overdue", "\" is overdue.");
    }

    /**
     * Runs one reminder scan: find candidates, push a "{title} {bodyPrefix}…{bodySuffix}"
     * message for each, and stamp it fired. Stamping happens regardless of delivery
     * outcome — dispatch is best-effort, and we must never remind for the same task twice.
     */
    private void scan(String kind,
                      Supplier<List<DueTaskReminder>> finder,
                      Consumer<UUID> markSent,
                      String title,
                      String bodySuffix) {
        List<DueTaskReminder> due;
        try {
            due = finder.get();
        } catch (Exception e) {
            log.warn("Reminder scan '{}' failed: {}", kind, e.getMessage());
            return;
        }
        if (due.isEmpty()) {
            return;
        }
        for (DueTaskReminder r : due) {
            try {
                String url = r.getGoalId() != null ? "/goals/" + r.getGoalId() : "/goals/calendar";
                pushDispatcher.dispatch(
                        r.getUserId(),
                        new PushMessage(title, "\"" + r.getTitle() + bodySuffix, url));
                markSent.accept(r.getTaskId());
            } catch (Exception e) {
                log.warn("Failed to send '{}' reminder for task {}: {}", kind, r.getTaskId(), e.getMessage());
            }
        }
        log.info("Sent {} '{}' task reminder(s)", due.size(), kind);
    }
}
