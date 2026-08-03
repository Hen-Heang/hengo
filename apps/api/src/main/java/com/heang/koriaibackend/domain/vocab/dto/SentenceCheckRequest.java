package com.heang.koriaibackend.domain.vocab.dto;

public record SentenceCheckRequest(
        String challengePrompt,
        String attempt
) {}
