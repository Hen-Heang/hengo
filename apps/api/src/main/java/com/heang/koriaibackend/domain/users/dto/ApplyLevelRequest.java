package com.heang.koriaibackend.domain.users.dto;

import jakarta.validation.constraints.NotBlank;

public record ApplyLevelRequest(
        @NotBlank String level
) {
}
