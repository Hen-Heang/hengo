package com.heang.koriaibackend.domain.dailyphrase.dto;

import com.heang.koriaibackend.domain.dailyphrase.model.DailyPhrase;

import java.util.List;

public record DailyPhraseResponse(
        String id,
        String date,
        String phrase,
        String meaning,
        String romanization,
        String whenToUse,
        String formality,
        List<SimilarExpression> similarExpressions,
        boolean learned
) {
    public static DailyPhraseResponse from(DailyPhrase phrase, List<SimilarExpression> similar) {
        return new DailyPhraseResponse(
                String.valueOf(phrase.getId()),
                phrase.getPhraseDate() != null ? phrase.getPhraseDate().toString() : "-",
                phrase.getPhraseKr(),
                phrase.getMeaningEn(),
                phrase.getRomanization(),
                phrase.getWhenToUse(),
                phrase.getFormalityLevel(),
                similar,
                phrase.isLearned()
        );
    }
}
