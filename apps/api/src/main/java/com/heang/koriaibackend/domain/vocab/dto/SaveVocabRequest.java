package com.heang.koriaibackend.domain.vocab.dto;

import jakarta.validation.constraints.NotBlank;

public record SaveVocabRequest(
        String category,
        @NotBlank String term,
        @NotBlank String meaning,
        String example
) {
}
