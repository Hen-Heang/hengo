package com.heang.koriaibackend.domain.goal.dto;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record UpdateTaskRequest(
        String title,
        String description,
        Boolean completed,
        String startDate,
        String endDate,
        String dailyStartTime,
        String dailyEndTime,
        Boolean isAnytime,
        Integer durationMinutes,
        String color,
        List<String> tags
) {
}
