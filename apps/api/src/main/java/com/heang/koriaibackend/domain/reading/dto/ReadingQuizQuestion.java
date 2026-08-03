package com.heang.koriaibackend.domain.reading.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ReadingQuizQuestion(
        @NotBlank String question,
        @NotEmpty @Size(min = 2, max = 4) List<String> options,
        int answerIndex,
        String explanation
) {
}
