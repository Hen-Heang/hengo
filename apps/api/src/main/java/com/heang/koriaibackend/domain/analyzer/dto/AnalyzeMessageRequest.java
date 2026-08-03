package com.heang.koriaibackend.domain.analyzer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnalyzeMessageRequest(
        @NotBlank String text,
        @Size(max = 50) String source
) {
}
