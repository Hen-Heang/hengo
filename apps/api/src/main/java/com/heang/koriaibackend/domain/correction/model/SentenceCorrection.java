package com.heang.koriaibackend.domain.correction.model;

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
public class SentenceCorrection {
    private Long id;
    private Long userId;
    private String originalText;
    private String correctedText;
    private Integer rating;
    private String explanation;
    private String grammarPoints;
    private String changes;
    private String modelUsed;
    private OffsetDateTime createdAt;
    private int mastery;
    private LocalDate nextReviewDate;
    @Builder.Default
    private double easeFactor = 2.5;
    private int intervalDays;
    private int repetitions;
    private int lapses;
}
