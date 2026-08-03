package com.heang.koriaibackend.domain.reading.model;

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
public class ReadingUnit {
    private Long id;
    private Long userId;
    private String episode;
    private String title;
    private String titleEnglish;
    private String category;
    private String level;
    private String summary;
    private String source;
    private String grammarNote;
    private String paragraphs;
    private String vocab;
    private String quiz;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
