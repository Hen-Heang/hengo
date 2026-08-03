package com.heang.koriaibackend.domain.users.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Per-user daily study-reminder preferences (drives {@code StudyReminderScheduler}).
 * {@code hour} is the local (Seoul) hour-of-day to send the reviews-due nudge.
 */
public record UpdateStudyRemindersRequest(
        @NotNull Boolean enabled,
        @NotNull @Min(0) @Max(23) Integer hour
) {
}
