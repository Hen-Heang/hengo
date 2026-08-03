package com.heang.koriaibackend.domain.reading.dto;

import java.util.List;

public record ReadingUnitResponse(
        String id,
        String episode,
        String title,
        String titleEnglish,
        String category,
        String level,
        String summary,
        String source,
        ReadingGrammarNote grammarNote,
        List<ReadingParagraph> paragraphs,
        List<ReadingVocabItem> vocab,
        List<ReadingQuizQuestion> quiz,
        String createdAt,
        String updatedAt
) {
}
