package com.heang.koriaibackend.domain.interview.model;

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
public class InterviewScript {
    private Long id;
    private Long userId;
    private String topicId;
    /** JSON object keyed by outline section id, stored as jsonb. */
    private String sections;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
