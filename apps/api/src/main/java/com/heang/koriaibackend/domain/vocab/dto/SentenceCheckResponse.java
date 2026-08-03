package com.heang.koriaibackend.domain.vocab.dto;

public record SentenceCheckResponse(
        int score,
        boolean correct,
        String feedback,
        String correctedSentence,
        String betterAlternative,
        String grammarNote
) {}
