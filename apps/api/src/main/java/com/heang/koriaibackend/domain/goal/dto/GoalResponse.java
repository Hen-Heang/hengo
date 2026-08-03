package com.heang.koriaibackend.domain.goal.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;
import com.heang.koriaibackend.domain.goal.model.Goal;

import java.util.UUID;

/**
 * Goal JSON matches the Orbit/INTEGRATION.md contract: snake_case DB fields plus
 * camelCase client-side enrichments (isStarred, taskCounts). {@code metadata} is
 * emitted as a JSON object, not a string.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record GoalResponse(
        UUID id,
        String userId,            // -> user_id (string, matches frontend type)
        String title,
        String description,
        String targetDate,        // -> target_date
        boolean noDuration,       // -> no_duration
        String status,
        JsonNode metadata,
        UUID shareCode,           // -> share_code
        boolean isPublic,         // -> is_public
        String publicSlug,        // -> public_slug
        UUID themeId,             // -> theme_id
        String createdAt,         // -> created_at
        String updatedAt,         // -> updated_at
        @JsonProperty("isStarred") boolean isStarred,
        @JsonProperty("taskCounts") TaskCounts taskCounts
) {
    public record TaskCounts(int total, int completed, int incomplete) {
    }

    public static GoalResponse of(Goal g, JsonNode metadata) {
        int total = g.getTaskTotal() != null ? g.getTaskTotal() : 0;
        int completed = g.getTaskCompleted() != null ? g.getTaskCompleted() : 0;
        return new GoalResponse(
                g.getId(),
                g.getUserId() != null ? String.valueOf(g.getUserId()) : null,
                g.getTitle(),
                g.getDescription(),
                g.getTargetDate() != null ? g.getTargetDate().toString() : null,
                g.getTargetDate() == null,
                g.getStatus(),
                metadata,
                g.getShareCode(),
                g.isPublicGoal(),
                g.getPublicSlug(),
                g.getThemeId(),
                g.getCreatedAt() != null ? g.getCreatedAt().toString() : null,
                g.getUpdatedAt() != null ? g.getUpdatedAt().toString() : null,
                g.isStarred(),
                new TaskCounts(total, completed, Math.max(0, total - completed))
        );
    }
}
