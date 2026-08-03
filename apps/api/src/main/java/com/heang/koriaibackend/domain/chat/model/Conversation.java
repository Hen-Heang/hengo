package com.heang.koriaibackend.domain.chat.model;

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
public class Conversation {
    private Long id;
    private Long userId;
    private Long scenarioId;
    private String title;
    private String conversationType;
    private String modelUsed;
    private Integer messageCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
