package com.heang.koriaibackend.domain.goal.dto;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Snake_case input per the Orbit contract. metadata is a free-form JSON blob. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record CreateGoalRequest(
        @NotBlank @Size(max = 500) String title,
        String description,
        String targetDate,
        Boolean noDuration,
        String status,
        JsonNode metadata
) {
}
