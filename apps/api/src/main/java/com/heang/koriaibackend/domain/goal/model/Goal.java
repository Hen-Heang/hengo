package com.heang.koriaibackend.domain.goal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {
    private UUID id;
    private Long userId;
    private String title;
    private String description;
    private OffsetDateTime targetDate;
    private String status;
    /** jsonb, stored as text. */
    private String metadata;
    private UUID shareCode;
    /** Maps to column is_public. Avoids the Lombok/MyBatis `is`-prefix property pitfall. */
    private boolean publicGoal;
    private String publicSlug;
    private String aiPrompt;
    private UUID themeId;
    /** jsonb, stored as text. */
    private String preferences;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    // Enrichment columns populated by the *enriched* finders (not persisted directly).
    private Integer taskTotal;
    private Integer taskCompleted;
    private boolean starred;
}
