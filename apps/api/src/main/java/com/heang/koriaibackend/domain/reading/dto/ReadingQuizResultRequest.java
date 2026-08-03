package com.heang.koriaibackend.domain.reading.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReadingQuizResultRequest(
        @NotNull @Min(0) Integer score,
        @NotNull @Min(1) Integer total
) {
}
