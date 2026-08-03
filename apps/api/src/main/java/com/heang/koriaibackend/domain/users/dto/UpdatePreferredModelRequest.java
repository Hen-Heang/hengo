package com.heang.koriaibackend.domain.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePreferredModelRequest(
        @NotBlank @Size(max = 100) String preferredModel
) {
}
