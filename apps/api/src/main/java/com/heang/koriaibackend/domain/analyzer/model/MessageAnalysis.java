package com.heang.koriaibackend.domain.analyzer.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageAnalysis {
    private Long id;
    private Long userId;
    private String source;
    private String originalText;
    private String literalMeaning;
    private String naturalMeaning;
    private String businessContext;
    private String politenessLevel;
    private String tone;
    private String breakdown;
    private String suggestedReplies;
    private String modelUsed;
    private OffsetDateTime createdAt;
}
