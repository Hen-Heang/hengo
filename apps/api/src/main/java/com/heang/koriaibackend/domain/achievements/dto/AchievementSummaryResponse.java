package com.heang.koriaibackend.domain.achievements.dto;

import java.util.List;

public record AchievementSummaryResponse(
        LevelInfo level,
        int unlockedCount,
        int totalCount,
        List<AchievementResponse> achievements
) {
}
