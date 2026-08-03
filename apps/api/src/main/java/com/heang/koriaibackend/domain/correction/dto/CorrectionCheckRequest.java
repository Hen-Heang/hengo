package com.heang.koriaibackend.domain.correction.dto;

import jakarta.validation.constraints.NotBlank;

public record CorrectionCheckRequest(
        @NotBlank String text
) {
}
