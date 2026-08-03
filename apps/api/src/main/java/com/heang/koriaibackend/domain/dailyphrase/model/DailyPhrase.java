package com.heang.koriaibackend.domain.dailyphrase.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyPhrase {
    private Long id;
    private Long userId;
    private LocalDate phraseDate;
    private String phraseKr;
    private String meaningEn;
    private String romanization;
    private String whenToUse;
    private String formalityLevel;
    private String similarExpressions;
    private boolean learned;
    private String modelUsed;
    private OffsetDateTime createdAt;
}
