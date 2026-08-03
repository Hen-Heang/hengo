package com.heang.koriaibackend.domain.goal.dto;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;
import com.heang.koriaibackend.domain.goal.model.Task;

import java.util.List;
import java.util.UUID;

/** Task JSON is fully snake_case per the Orbit/INTEGRATION.md contract (lib/tasks.ts). */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record TaskResponse(
        UUID id,
        UUID goalId,            // -> goal_id (null = personal)
        String userId,          // -> user_id
        String title,
        String description,
        boolean completed,
        String startDate,       // -> start_date
        String endDate,         // -> end_date
        String dailyStartTime,  // -> daily_start_time
        String dailyEndTime,    // -> daily_end_time
        boolean isAnytime,      // -> is_anytime
        Integer durationMinutes,// -> duration_minutes
        String color,
        List<String> tags,
        String updatedBy,       // -> updated_by
        String createdAt,       // -> created_at
        String updatedAt        // -> updated_at
) {
    public static TaskResponse of(Task t) {
        return new TaskResponse(
                t.getId(),
                t.getGoalId(),
                t.getUserId() != null ? String.valueOf(t.getUserId()) : null,
                t.getTitle(),
                t.getDescription(),
                t.isCompleted(),
                t.getStartDate() != null ? t.getStartDate().toString() : null,
                t.getEndDate() != null ? t.getEndDate().toString() : null,
                t.getDailyStartTime() != null ? t.getDailyStartTime().toString() : null,
                t.getDailyEndTime() != null ? t.getDailyEndTime().toString() : null,
                t.isAnytime(),
                t.getDurationMinutes(),
                t.getColor(),
                t.getTags(),
                t.getUpdatedBy() != null ? String.valueOf(t.getUpdatedBy()) : null,
                t.getCreatedAt() != null ? t.getCreatedAt().toString() : null,
                t.getUpdatedAt() != null ? t.getUpdatedAt().toString() : null
        );
    }
}
