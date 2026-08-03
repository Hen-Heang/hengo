package com.heang.koriaibackend.domain.vocab.dto;

import com.heang.koriaibackend.domain.vocab.model.VocabCard;

import java.util.List;

public record VocabItemResponse(
        String id,
        String category,
        String term,
        String meaning,
        String example,
        String exampleTranslation,
        String pronunciation,
        String difficultyLevel,
        int mastery,
        String nextReview,
        List<String> tags,
        double easeFactor,
        int intervalDays,
        int repetitions,
        int lapses
) {
    public static VocabItemResponse from(VocabCard card) {
        return new VocabItemResponse(
                String.valueOf(card.getId()),
                card.getCategory(),
                card.getTerm(),
                card.getMeaning(),
                card.getExample(),
                card.getExampleTranslation(),
                card.getPronunciation(),
                card.getDifficultyLevel(),
                card.getMastery(),
                card.getNextReviewDate() != null ? card.getNextReviewDate().toString() : "-",
                parseTags(card.getTags()),
                card.getEaseFactor(),
                card.getIntervalDays(),
                card.getRepetitions(),
                card.getLapses()
        );
    }

    private static List<String> parseTags(String json) {
        if (json == null || json.isBlank() || json.equals("[]")) {
            return List.of();
        }
        return java.util.Arrays.stream(json.replaceAll("[\\[\\]\"]", "").split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
