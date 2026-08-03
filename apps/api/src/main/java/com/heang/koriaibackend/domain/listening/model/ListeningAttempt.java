package com.heang.koriaibackend.domain.listening.model;

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
public class ListeningAttempt {
    private Long id;
    private Long userId;
    private Long lessonId;
    private int score;
    private int total;
    private int accuracy;
    private boolean completed;
    private OffsetDateTime createdAt;
}
