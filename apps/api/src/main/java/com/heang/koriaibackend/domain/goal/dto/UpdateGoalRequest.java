package com.heang.koriaibackend.domain.goal.dto;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.Size;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record UpdateGoalRequest(
        @Size(max = 500) String title,
        String description,
        String targetDate,
        Boolean isPublic,
        JsonNode metadata
) {
}
