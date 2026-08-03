package com.heang.koriaibackend.domain.messagegen.dto;

public record MessageVariation(
        String korean,
        String romanization,
        String formality,
        String situation
) {
}
