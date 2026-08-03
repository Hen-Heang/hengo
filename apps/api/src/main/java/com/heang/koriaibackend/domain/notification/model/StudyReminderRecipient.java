package com.heang.koriaibackend.domain.notification.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A user who should receive a daily study reminder this minute, returned by
 * {@code StudyReminderMapper}. {@code dueCount} carries the number of SRS cards
 * due for the "reviews due" nudge (unused / 0 for the streak saver).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyReminderRecipient {
    private Long userId;
    private int dueCount;
}
