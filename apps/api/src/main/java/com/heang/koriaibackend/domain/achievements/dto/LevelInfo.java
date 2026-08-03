package com.heang.koriaibackend.domain.achievements.dto;

public record LevelInfo(
        int level,
        String name,
        int totalXp,
        int xpIntoLevel,
        Integer xpForNextLevel,
        String nextLevelName
) {
}
