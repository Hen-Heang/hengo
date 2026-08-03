package com.heang.koriaibackend.domain.analyzer.dto;

import com.heang.koriaibackend.domain.analyzer.model.MessageAnalysis;

import java.time.OffsetDateTime;
import java.util.List;

public record MessageAnalysisResponse(
        Long id,
        String source,
        String originalText,
        String literalMeaning,
        String naturalMeaning,
        String businessContext,
        String politenessLevel,
        String tone,
        List<AnalysisBreakdownItem> breakdown,
        List<SuggestedReply> suggestedReplies,
        String modelUsed,
        OffsetDateTime createdAt
) {
    public static MessageAnalysisResponse from(MessageAnalysis analysis,
                                               List<AnalysisBreakdownItem> breakdown,
                                               List<SuggestedReply> suggestedReplies) {
        return new MessageAnalysisResponse(
                analysis.getId(),
                analysis.getSource(),
                analysis.getOriginalText(),
                analysis.getLiteralMeaning(),
                analysis.getNaturalMeaning(),
                analysis.getBusinessContext(),
                analysis.getPolitenessLevel(),
                analysis.getTone(),
                breakdown,
                suggestedReplies,
                analysis.getModelUsed(),
                analysis.getCreatedAt()
        );
    }
}
