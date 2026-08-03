package com.heang.koriaibackend.domain.users.dto;

public record LevelSuggestionResponse(
        String currentLevel,
        String suggestedLevel,
        boolean upgradeAvailable,
        String reason,
        int streakDays,
        int wordsSaved,
        double avgVocabMastery,
        double avgCorrectionRating
) {
}
