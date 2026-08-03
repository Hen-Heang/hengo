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
public class ListeningLesson {
    private Long id;
    private Long userId;
    private String topic;
    private String title;
    private String level;
    private String transcript;
    private String quiz;
    private String modelUsed;
    private OffsetDateTime createdAt;
}
