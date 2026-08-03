package com.heang.koriaibackend.domain.vocab.dto;

public record SentenceChallengeResponse(
        String cardId,
        String term,
        String meaning,
        String challengePrompt,
        String contextHint,
        String exampleAnswer
) {}
