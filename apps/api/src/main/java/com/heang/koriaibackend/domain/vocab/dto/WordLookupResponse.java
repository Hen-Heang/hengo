package com.heang.koriaibackend.domain.vocab.dto;

public record WordLookupResponse(
        String word,
        String definition,
        String example,
        String exampleTranslation,
        String hanja
) {
}
