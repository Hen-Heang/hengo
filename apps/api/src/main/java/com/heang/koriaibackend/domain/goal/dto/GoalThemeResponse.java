package com.heang.koriaibackend.domain.goal.dto;

import com.heang.koriaibackend.domain.goal.model.GoalTheme;

import java.util.UUID;

public record GoalThemeResponse(
        UUID id,
        Long userId,
        String name,
        String goalProfileImage,
        String cardBackgroundImage,
        String pageBackgroundImage,
        boolean isPublic,
        String createdAt,
        String updatedAt
) {
    public static GoalThemeResponse of(GoalTheme t) {
        return new GoalThemeResponse(
                t.getId(),
                t.getUserId(),
                t.getName(),
                t.getGoalProfileImage(),
                t.getCardBackgroundImage(),
                t.getPageBackgroundImage(),
                t.isPublicTheme(),
                t.getCreatedAt() != null ? t.getCreatedAt().toString() : null,
                t.getUpdatedAt() != null ? t.getUpdatedAt().toString() : null
        );
    }
}
