package com.heang.koriaibackend.domain.messagegen.dto;

import jakarta.validation.constraints.NotBlank;

public record GenerateMessageRequest(
        @NotBlank String intent,
        @NotBlank String category
) {
}
