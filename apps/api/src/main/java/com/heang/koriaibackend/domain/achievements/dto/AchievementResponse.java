package com.heang.koriaibackend.domain.achievements.dto;

public record AchievementResponse(
        String code,
        String title,
        String description,
        String icon,
        String category,
        int xp,
        boolean unlocked,
        String unlockedAt
) {
}
