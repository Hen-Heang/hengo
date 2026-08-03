package com.heang.koriaibackend.domain.vocab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateVocabRequest(
        @Size(max = 100) String category,
        @NotBlank @Size(max = 200) String term,
        @NotBlank String meaning,
        String example,
        @Size(max = 300) String pronunciation
) {}
