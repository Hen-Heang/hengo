package com.heang.koriaibackend.domain.goal.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record GenerateTasksRequest(
        @Min(1) @Max(14) Integer count,
        @Size(max = 500) String note
) {
}
