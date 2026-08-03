package com.heang.koriaibackend.domain.goal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Projection of a task whose reminder window is due — returned by
 * {@code TaskMapper.findDueReminders} and consumed by the per-minute
 * {@code ReminderScheduler}. Mirrors Orbit's get_due_task_reminders() RPC.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DueTaskReminder {
    private UUID taskId;
    private Long userId;
    private String title;
    private UUID goalId;
}
