package com.heang.koriaibackend.domain.vocab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ImportVocabRequest(
        @NotBlank @Size(max = 100) String category,
        @NotBlank @Size(max = 8000) String text
) {}
