package com.heang.koriaibackend.domain.vocab.model;

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
public class VocabCard {
    private Long id;
    private Long userId;
    private String category;
    private String term;
    private String meaning;
    private String example;
    private String exampleTranslation;
    private String pronunciation;
    private String difficultyLevel;
    private int mastery;
    private LocalDate nextReviewDate;
    private String tags;
    private OffsetDateTime createdAt;
    @Builder.Default
    private double easeFactor = 2.5;
    private int intervalDays;
    private int repetitions;
    private int lapses;
}