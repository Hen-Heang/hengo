package com.heang.koriaibackend.domain.foundation.model;

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
public class FoundationProgress {
    private Long id;
    private Long userId;
    private String lessonId;
    private String track;
    private boolean completed;
    private int accuracy;
    private int attempts;
    private OffsetDateTime lastAttemptAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
