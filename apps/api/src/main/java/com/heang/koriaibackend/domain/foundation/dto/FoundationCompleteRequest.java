package com.heang.koriaibackend.domain.foundation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// The frontend grades the attempt locally (lib/foundations-data has the answers)
// and posts the resulting accuracy + completion. The backend stores the best
// result per lesson so progress syncs across devices.
public record FoundationCompleteRequest(
        @NotBlank String track,
        @NotNull @Min(0) @Max(100) Integer accuracy,
        @NotNull Boolean completed
) {
}
