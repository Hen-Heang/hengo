package com.heang.koriaibackend.domain.goal.dto;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

import java.util.List;
import java.util.UUID;

/** Snake_case input per the Orbit contract (lib/tasks.ts). */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record CreateTaskRequest(
        /** Optional: null creates a standalone personal/daily task. */
        UUID goalId,
        String title,
        String description,
        String startDate,
        String endDate,
        String dailyStartTime,
        String dailyEndTime,
        Boolean isAnytime,
        Integer durationMinutes,
        String color,
        List<String> tags,
        Boolean completed
) {
}
