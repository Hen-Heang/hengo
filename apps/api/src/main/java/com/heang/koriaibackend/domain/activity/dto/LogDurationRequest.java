package com.heang.koriaibackend.domain.activity.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LogDurationRequest(
        @NotBlank @Size(max = 50) String feature,
        @Min(1) @Max(28_800_000) long durationMs
) {
}
