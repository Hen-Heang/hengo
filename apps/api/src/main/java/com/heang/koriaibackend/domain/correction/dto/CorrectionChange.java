package com.heang.koriaibackend.domain.correction.dto;

public record CorrectionChange(
        String original,
        String corrected,
        String englishMeaning,
        String reason
) {
}