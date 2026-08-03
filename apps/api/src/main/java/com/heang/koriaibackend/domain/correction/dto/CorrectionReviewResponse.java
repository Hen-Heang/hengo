package com.heang.koriaibackend.domain.correction.dto;

import com.heang.koriaibackend.domain.correction.model.SentenceCorrection;

import java.time.LocalDate;
import java.util.List;

public record CorrectionReviewResponse(
        Long id,
        String originalText,
        String correctedText,
        String explanation,
        List<String> grammarPoints,
        int mastery,
        LocalDate nextReviewDate,
        double easeFactor,
        int intervalDays,
        int repetitions,
        int lapses
) {
    public static CorrectionReviewResponse from(SentenceCorrection correction, List<String> grammarPoints) {
        return new CorrectionReviewResponse(
                correction.getId(),
                correction.getOriginalText(),
                correction.getCorrectedText(),
                correction.getExplanation(),
                grammarPoints,
                correction.getMastery(),
                correction.getNextReviewDate(),
                correction.getEaseFactor(),
                correction.getIntervalDays(),
                correction.getRepetitions(),
                correction.getLapses()
        );
    }
}
