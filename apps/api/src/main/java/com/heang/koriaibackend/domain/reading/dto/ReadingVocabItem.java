package com.heang.koriaibackend.domain.reading.dto;

import jakarta.validation.constraints.NotBlank;

public record ReadingVocabItem(
        @NotBlank String term,
        @NotBlank String meaning,
        String example
) {
}
