package com.heang.koriaibackend.domain.reading.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ReadingUnitRequest(
        String episode,
        @NotBlank String title,
        @NotBlank String titleEnglish,
        @NotBlank String category,
        @NotBlank String level,
        String summary,
        String source,
        @Valid ReadingGrammarNote grammarNote,
        @NotEmpty @Valid List<ReadingParagraph> paragraphs,
        @Valid List<ReadingVocabItem> vocab,
        @Valid List<ReadingQuizQuestion> quiz
) {
}
