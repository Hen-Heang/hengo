package com.heang.koriaibackend.domain.correction.dto;

import com.heang.koriaibackend.domain.correction.model.SentenceCorrection;

import java.time.OffsetDateTime;
import java.util.List;

public record CorrectionResponse(
        Long id,
        String originalText,
        String correctedText,
        Integer rating,
        String explanation,
        List<String> grammarPoints,
        List<CorrectionChange> changes,
        String modelUsed,
        OffsetDateTime createdAt
) {
    public static CorrectionResponse from(SentenceCorrection correction, List<String> grammarPoints, List<CorrectionChange> changes) {
        return new CorrectionResponse(
                correction.getId(),
                correction.getOriginalText(),
                correction.getCorrectedText(),
                correction.getRating(),
                correction.getExplanation(),
                grammarPoints,
                changes,
                correction.getModelUsed(),
                correction.getCreatedAt()
        );
    }
}
