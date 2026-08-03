package com.heang.koriaibackend.domain.reading.dto;

import jakarta.validation.constraints.NotBlank;

public record ReadingParagraph(
        @NotBlank String korean,
        String english
) {
}
